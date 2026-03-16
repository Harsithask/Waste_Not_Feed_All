
/**
 * ScanScreen.js — Waste Not, Feed All
 *
 * SETUP (no downloads needed):
 * 1. Get FREE Groq API key at https://console.groq.com
 *    Sign up → API Keys → Create → paste below (starts with gsk_)
 * 2. Run: cd frontend && npx expo start
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';

// ── FREE Groq API key — works in India, no payment ───
// Get yours at: https://console.groq.com → API Keys → Create
const GROQ_API_KEY = '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'; // paste gsk_... key here

// ─────────────────────────────────────────────────────
// Safe alert wrapper
// ─────────────────────────────────────────────────────
const show = (title, msg) => {
  try { Alert.alert(String(title), String(msg ?? '')); }
  catch (e) { console.error('[ALERT FAILED]', title, msg, e); }
};

// ─────────────────────────────────────────────────────
// Proxy fetch — tries direct first, then multiple proxies
// ─────────────────────────────────────────────────────
const pfetch = async (url) => {
  const attempts = [
    // Direct fetch first (works if CORS is open)
    () => fetch(url, {
      headers: { 'User-Agent': 'WasteNotFeedAll/1.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    }),
    // Proxy 1
    () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }),
    // Proxy 2
    () => fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }),
    // Proxy 3 — most reliable fallback
    () => fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }),
  ];

  let lastError = '';
  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log('[PFETCH] attempt', i + 1, 'for', url.slice(0, 60));
      const res  = await attempts[i]();
      const text = await res.text();
      console.log('[PFETCH] status=', res.status, text.slice(0, 100));
      if (!text || text.trim() === '') { lastError = 'Empty response'; continue; }
      if (text.trim().startsWith('<')) { lastError = 'Got HTML not JSON'; continue; }
      return JSON.parse(text);
    } catch (e) {
      lastError = e.message;
      console.warn('[PFETCH] attempt', i + 1, 'failed:', e.message);
    }
  }
  throw new Error('All attempts failed. Last error: ' + lastError);
};

// ─────────────────────────────────────────────────────
// Convert image URI → base64 (works on web/localhost)
// ─────────────────────────────────────────────────────
const toBase64 = async (uri) => {
  console.log('[toBase64]', uri.slice(0, 80));
  const r    = await fetch(uri);
  const blob = await r.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result.split(',')[1];
      console.log('[toBase64] length=', b64?.length);
      resolve(b64);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
};

// ─────────────────────────────────────────────────────
// ExpiryTimer component
// ─────────────────────────────────────────────────────
const ExpiryTimer = ({ expiryDate }) => {
  const [txt,     setTxt]     = useState('');
  const [expired, setExpired] = useState(false);
  const [urgent,  setUrgent]  = useState(false);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiryDate).getTime() - Date.now();
      if (isNaN(ms) || ms <= 0) { setTxt('EXPIRED'); setExpired(true); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setUrgent(d < 2);
      setTxt(d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiryDate]);

  return (
    <Text style={[S.timer, expired && S.timerX, urgent && !expired && S.timerU]}>
      ⏳ {txt}
    </Text>
  );
};

// ─────────────────────────────────────────────────────
// Empty form — outside component for stability
// ─────────────────────────────────────────────────────
const EMPTY = { name: '', type: 'Packed', expiry: '', images: [] };

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function ScanScreen() {
  const [items,     setItems]     = useState([]);
  const [pageLoad,  setPageLoad]  = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [searching, setSearching] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [mode,      setMode]      = useState('view');
  const [scanner,   setScanner]   = useState(false);
  const [bigImg,    setBigImg]    = useState(null);
  const [form,      setForm]      = useState(EMPTY);

  useEffect(() => { loadPantry(); }, []);

  // ── Load pantry ────────────────────────────────────
  const loadPantry = async () => {
    setPageLoad(true);
    try {
      const { data, error } = await supabase
        .from('household_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data ?? []);
    } catch (e) {
      show('Load Error', e.message);
    }
    setPageLoad(false);
  };

  // ── Helpers ────────────────────────────────────────
  const future = (n, unit) => {
    const d = new Date();
    if (unit === 'h') d.setHours(d.getHours() + n);
    if (unit === 'd') d.setDate(d.getDate() + n);
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().slice(0, 5)}`;
  };

  const niceDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return iso; }
  };

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ══════════════════════════════════════════════════
  //  1. BARCODE LOOKUP
  // ══════════════════════════════════════════════════
  const lookupBarcode = (barcode) => {
    const code = (barcode ?? '').trim();
    console.log('[LOOKUP] code=', code);
    if (!code) { show('Empty', 'Type or scan a barcode first.'); return; }

    setSearching(true);

    const run = async () => {
      let found = null;

      // Skip all external APIs — they all timeout/block from India.
      // Use Groq AI directly as the only lookup method.
      // Groq has training data on Indian products and works perfectly.
      try {
        console.log('[LOOKUP] asking Groq AI for barcode:', code);
        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 80,
            messages: [{
              role: 'user',
              content: `Indian product barcode: ${code}
What Indian product has this barcode? Give your best guess — brand name and product name only, no explanation.
Examples: "Amul Butter 500g", "Parle-G Biscuits", "Britannia Good Day"
If you have absolutely no idea, reply: UNKNOWN`,
            }],
          }),
        });
        const aiData = await aiRes.json();
        console.log('[LOOKUP] Groq response:', JSON.stringify(aiData).slice(0, 200));
        if (aiData.error) throw new Error(aiData.error.message);
        const aiName = aiData.choices?.[0]?.message?.content?.trim();
        console.log('[LOOKUP] Groq name:', aiName);
        if (aiName && !aiName.toUpperCase().includes('UNKNOWN') && aiName.length > 1 && aiName.length < 100) {
          found = aiName;
        }
      } catch (e) {
        console.error('[LOOKUP] Groq error:', e.message);
        setSearching(false);
        show('Lookup Failed', 'Could not reach Groq AI: ' + e.message);
        return;
      }

      setSearching(false);
      console.log('[LOOKUP] result=', found);

      if (found) {
        setForm(prev => ({ ...prev, name: found }));
        show('Product Found ✅', 'Name set to:\n"' + found + '"');
      } else {
        // Barcode not in any database — prompt user to use photo instead
        if (typeof window !== 'undefined' && window.confirm) {
          const yes = window.confirm(
            'Barcode ' + code + ' is not in any database.\n\n' +
            'Click OK to add a photo of the product so AI can read the name from the label.\n' +
            'Click Cancel to type the name manually.'
          );
          if (yes) {
            show('Add a Photo', 'Use the "Camera" or "Gallery" button below to add a photo of the product label, then tap "Analyse with AI".');
          }
        } else {
          Alert.alert(
            'Barcode Not Found',
            'Barcode ' + code + ' is not in any database.\n\nAdd a photo of the product label below and tap "Analyse with AI" to read the name automatically.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    run().catch(e => {
      setSearching(false);
      console.error('[LOOKUP] crashed:', e);
      show('Lookup Failed', e.message);
    });
  };

  // ══════════════════════════════════════════════════
  //  2. IMAGE PICKER
  // ══════════════════════════════════════════════════
  const pickImage = (camera) => {
    if (form.images.length >= 3) { show('Limit reached', 'Maximum 3 images allowed.'); return; }

    const run = async () => {
      const perm = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { show('Permission denied', 'Allow access in Settings.'); return; }

      const res = camera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });

      if (!res.canceled) {
        const uri = res.assets[0].uri;
        console.log('[IMAGE PICKED]', uri.slice(0, 80));
        setField('images', [...form.images, uri]);
      }
    };

    run().catch(e => show('Image picker error', e.message));
  };

  const removeImage = (i) => setField('images', form.images.filter((_, idx) => idx !== i));

  // ══════════════════════════════════════════════════
  //  3. AI ANALYSIS — Groq (FREE, works in India)
  // ══════════════════════════════════════════════════
  const analyseWithAI = () => {
    console.log('[AI] pressed, images=', form.images.length);

    if (form.images.length === 0) {
      show('No images', 'Add at least one photo first.');
      return;
    }
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      show(
        'Groq Key Missing',
        'Steps:\n1. Go to https://console.groq.com\n2. Sign up free\n3. Click API Keys → Create\n4. Paste the key (gsk_...) in ScanScreen.js line 21'
      );
      return;
    }

    setAnalysing(true);

    const run = async () => {
      // Step 1: convert images to base64
      console.log('[AI] converting images...');
      const b64s = [];
      for (const uri of form.images) {
        const b = await toBase64(uri);
        b64s.push(b);
      }
      console.log('[AI] converted', b64s.length, 'image(s)');

      // Step 2: build prompt
      const today = new Date().toISOString().split('T')[0];
      const prompt =
`Analyse this food image for an Indian kitchen app.
Return ONLY a raw JSON object — no markdown, no backticks, no extra text.

{"name":"string or null","type":"Packed or Cooked or null","expiry":"YYYY-MM-DD HH:mm or null","notes":"string or null"}

Rules:
- name: read product name from label. For cooked food describe it (e.g. "Chicken Biryani"). null if unreadable.
- type: "Packed" for sealed/manufactured product. "Cooked" for home-cooked food. null if unsure.
- expiry: read Best Before / Use By / Expiry from label if visible. Format: YYYY-MM-DD HH:mm
  If Cooked: rice/dal/curry=today+1day, meat=today+1day, baked=today+3days.
  If Packed and no visible date: null.
- notes: brief observation e.g. "expiry label partially obscured", or null.
- Today is ${today}.
Return ONLY the JSON object.`;

      // Step 3: call Groq API (free, works in India, no payment needed)
      console.log('[AI] calling Groq...');
      let res;
      try {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: [
                ...b64s.map(b => ({
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${b}` },
                })),
                { type: 'text', text: prompt },
              ],
            }],
          }),
        });
      } catch (e) {
        throw new Error('Could not reach Groq API: ' + e.message);
      }

      const resText = await res.text();
      console.log('[AI] Groq status=', res.status, 'body=', resText.slice(0, 300));

      let resData;
      try { resData = JSON.parse(resText); }
      catch { throw new Error('Groq returned invalid response: ' + resText.slice(0, 100)); }

      if (resData.error) throw new Error('Groq error: ' + resData.error.message);
      if (!res.ok)       throw new Error('Groq HTTP ' + res.status + ': ' + resText.slice(0, 100));

      const raw = resData.choices?.[0]?.message?.content?.trim() ?? '';
      if (!raw) throw new Error('Groq returned empty content.');
      console.log('[AI] raw content=', raw);

      // Step 4: parse JSON
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch {
        throw new Error('Could not parse AI response:\n' + raw);
      }

      // Step 5: apply to form, report missing fields
      const updates = {};
      const filled  = [];
      const missing = [];

      if (parsed.name) {
        updates.name = parsed.name.trim();
        filled.push('Name: ' + updates.name);
      } else {
        missing.push('Product name');
      }

      if (parsed.type === 'Packed' || parsed.type === 'Cooked') {
        updates.type = parsed.type;
        filled.push('Type: ' + updates.type);
      } else {
        missing.push('Type (Packed / Cooked)');
      }

      if (parsed.expiry) {
        updates.expiry = parsed.expiry.trim();
        filled.push('Expiry: ' + updates.expiry);
      } else {
        missing.push('Expiry date');
      }

      console.log('[AI] updates=', updates, 'missing=', missing);
      setForm(prev => ({ ...prev, ...updates }));

      const filledStr  = filled.length  ? '✅ Filled:\n' + filled.join('\n')                                              : 'Nothing could be filled.';
      const missingStr = missing.length ? '\n\n⚠️ Not detected — fill manually:\n' + missing.map(m => '• ' + m).join('\n') : '';
      const notesStr   = parsed.notes   ? '\n\nAI note: ' + parsed.notes                                                  : '';

      show('AI Analysis Complete', filledStr + missingStr + notesStr);
    };

    run().catch(e => {
      console.error('[AI] crashed:', e);
      show('AI Failed', e.message);
    }).finally(() => setAnalysing(false));
  };

  // ══════════════════════════════════════════════════
  //  4. SAVE TO SUPABASE
  // ══════════════════════════════════════════════════
  const saveItem = () => {
    const name   = (form.name   ?? '').trim();
    const expiry = (form.expiry ?? '').trim();

    console.log('[SAVE] name=', name, 'expiry=', expiry, 'type=', form.type);

    if (!name)   { show('Name required',   'Please enter the product name.'); return; }
    if (!expiry) { show('Expiry required', 'Please enter the expiry date.');  return; }

    const expiryDate = new Date(expiry.replace(' ', 'T'));
    if (isNaN(expiryDate.getTime())) {
      show('Invalid date', '"' + expiry + '" is not valid.\nUse format: YYYY-MM-DD HH:mm');
      return;
    }

    setSaving(true);

    const run = async () => {
      // Upload images to Supabase Storage
      const urls = [];
      for (const uri of form.images) {
        try {
          console.log('[SAVE] uploading image...');
          const r        = await fetch(uri);
          const blob     = await r.blob();
          const ext      = uri.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `pantry_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('pantry_images')
            .upload(fileName, blob, { contentType: blob.type || 'image/jpeg' });

          if (upErr) {
            console.warn('[SAVE] image upload failed:', upErr.message);
          } else {
            const { data: pub } = supabase.storage
              .from('pantry_images')
              .getPublicUrl(fileName);
            urls.push(pub.publicUrl);
            console.log('[SAVE] uploaded:', pub.publicUrl);
          }
        } catch (imgErr) {
          console.warn('[SAVE] image skipped:', imgErr.message);
        }
      }

      // Insert row
      console.log('[SAVE] inserting row...');
      const { data: inserted, error: dbErr } = await supabase
        .from('household_inventory')
        .insert([{
          name,
          type:      form.type,
          expiry:    expiryDate.toISOString(),
          image_url: urls[0] ?? null,
        }])
        .select();

      console.log('[SAVE] result:', inserted, dbErr);
      if (dbErr) throw new Error(dbErr.message);

      show('Saved! ✅', '"' + name + '" has been added to your pantry.');
      setForm(EMPTY);
      setMode('view');
      setScanner(false);
      loadPantry();
    };

    run().catch(e => {
      console.error('[SAVE] crashed:', e);
      show('Save Failed', e.message);
    }).finally(() => setSaving(false));
  };

  // ══════════════════════════════════════════════════
  //  5. DELETE — works on both web and native
  // ══════════════════════════════════════════════════
  const deleteItem = (id, name) => {
    const doDelete = () => {
      supabase.from('household_inventory').delete().eq('id', id)
        .then(({ error }) => {
          if (error) { show('Delete failed', error.message); }
          else {
            setItems(prev => prev.filter(i => i.id !== id));
            show('Deleted', '"' + name + '" removed from your pantry.');
          }
        })
        .catch(e => show('Delete error', e.message));
    };
    // window.confirm works on web/localhost
    // Alert.alert works on native
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Delete "' + name + '" from your pantry?')) doDelete();
    } else {
      Alert.alert('Delete item?', 'Remove "' + name + '"?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ══════════════════════════════════════════════════
  //  6. DONATE
  // ══════════════════════════════════════════════════
  const donateItem = (item) => {
    const run = async () => {
      const { error } = await supabase
        .from('donations')
        .insert([{ name: item.name, expiry: item.expiry }]);
      if (error) { show('Donate failed', error.message); return; }
      await supabase.from('household_inventory').delete().eq('id', item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      show('Donated! 💚', '"' + item.name + '" moved to the community feed.');
    };
    run().catch(e => show('Donate error', e.message));
  };

  const cardImg = (item) => item.image_urls?.[0] ?? item.image_url ?? null;

  // ── Loading screen ─────────────────────────────────
  if (pageLoad) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 12, color: '#7f8c8d' }}>Loading pantry…</Text>
      </View>
    );
  }

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <ScrollView style={S.page} showsVerticalScrollIndicator={false}>
      <Text style={S.header}>My Kitchen Dashboard</Text>

      {/* Full-screen image modal */}
      <Modal visible={!!bigImg} transparent animationType="fade">
        <View style={S.modalBg}>
          <TouchableOpacity style={S.modalX} onPress={() => setBigImg(null)}>
            <Text style={S.modalXT}>✕</Text>
          </TouchableOpacity>
          {bigImg && (
            <Image source={{ uri: bigImg }} style={S.modalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ════════════ VIEW MODE ════════════ */}
      {mode === 'view' && (
        <View>
          <TouchableOpacity style={S.addBtn} onPress={() => setMode('add')}>
            <Text style={S.addBtnT}>+ Add Food Item</Text>
          </TouchableOpacity>

          {items.length === 0 && (
            <View style={S.empty}>
              <Text style={S.emptyT}>Your pantry is empty</Text>
              <Text style={S.emptyS}>Tap "Add Food Item" to get started.</Text>
            </View>
          )}

          {items.map(item => {
            const img = cardImg(item);
            return (
              <View key={item.id} style={S.card}>
                <TouchableOpacity onPress={() => img && setBigImg(img)}>
                  {img
                    ? <Image source={{ uri: img }} style={S.cardImg} />
                    : <View style={[S.cardImg, S.cardImgX]}>
                        <Text style={{ fontSize: 26 }}>🍱</Text>
                      </View>
                  }
                </TouchableOpacity>

                <View style={S.cardBody}>
                  <Text style={S.cardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={S.cardMeta}>{item.type} · {niceDate(item.expiry)}</Text>
                  <ExpiryTimer expiryDate={item.expiry} />
                </View>

                <View style={S.cardBtns}>
                  <TouchableOpacity style={S.btnG} onPress={() => donateItem(item)}>
                    <Text style={S.iconT}>💚</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.btnR} onPress={() => deleteItem(item.id, item.name)}>
                    <Text style={S.iconT}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ════════════ ADD MODE ════════════ */}
      {mode === 'add' && (
        <View style={S.form}>
          <Text style={S.formT}>Add New Item</Text>

          {/* Barcode Scanner */}
          <View style={S.sec}>
            <Text style={S.secT}>Barcode Scanner</Text>
            <TouchableOpacity
              style={[S.outBtn, scanner && { backgroundColor: '#ebf5fb' }]}
              onPress={() => setScanner(v => !v)}
            >
              <Text style={S.outBtnT}>
                {scanner ? 'Close Scanner' : '📷 Open Barcode Scanner'}
              </Text>
            </TouchableOpacity>

            {scanner && (
              <View style={S.scanBox}>
                <BarcodeScannerComponent
                  width="100%"
                  height={220}
                  onUpdate={(_e, result) => {
                    if (result?.text) {
                      const code = result.text.trim();
                      setScanner(false);
                      setForm(prev => ({ ...prev, name: code }));
                      lookupBarcode(code);
                    }
                  }}
                />
                <Text style={S.scanHint}>Point camera at the barcode</Text>
              </View>
            )}
          </View>

          {/* Product Name + Lookup */}
          <View style={S.sec}>
            <Text style={S.lbl}>Product Name *</Text>
            <TextInput
              style={S.input}
              value={form.name}
              onChangeText={t => setField('name', t)}
              placeholder="Scan a barcode or type here"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={[S.btnPurple, (searching || !form.name.trim()) && S.disabled]}
              disabled={searching || !form.name.trim()}
              onPress={() => lookupBarcode(form.name.trim())}
            >
              {searching
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.btnPurpleT}>🔍 Lookup Product Name</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Food Photos + AI */}
          <View style={S.sec}>
            <Text style={S.secT}>Food Photos (max 3)</Text>
            <Text style={S.hint}>
              Add a photo then tap "Analyse with AI" to auto-fill all fields
            </Text>

            <View style={S.imgRow}>
              {form.images.map((uri, i) => (
                <View key={i} style={S.imgWrap}>
                  <TouchableOpacity onPress={() => setBigImg(uri)}>
                    <Image source={{ uri }} style={S.imgThumb} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.imgX} onPress={() => removeImage(i)}>
                    <Text style={S.imgXT}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {form.images.length < 3 && (
                <>
                  <TouchableOpacity style={S.imgAdd} onPress={() => pickImage(true)}>
                    <Text style={S.imgAddT}>📷{'\n'}Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.imgAdd} onPress={() => pickImage(false)}>
                    <Text style={S.imgAddT}>🖼️{'\n'}Gallery</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[S.btnAI, (analysing || form.images.length === 0) && S.disabled]}
              disabled={analysing || form.images.length === 0}
              onPress={analyseWithAI}
            >
              {analysing
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={S.btnAIT}>Analysing…</Text>
                  </View>
                : <Text style={S.btnAIT}>🤖 Analyse with AI</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={S.sec}>
            <Text style={S.lbl}>Category</Text>
            <View style={S.pickerWrap}>
              <Picker
                selectedValue={form.type}
                onValueChange={v => setField('type', v)}
                style={{ color: '#2c3e50' }}
              >
                <Picker.Item label="📦 Packed" value="Packed" />
                <Picker.Item label="🍳 Cooked" value="Cooked" />
              </Picker>
            </View>
          </View>

          {/* Expiry */}
          <View style={S.sec}>
            <Text style={S.lbl}>Expiry Date & Time *</Text>
            <TextInput
              style={S.input}
              value={form.expiry}
              onChangeText={t => setField('expiry', t)}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#aaa"
            />
            <View style={S.quickRow}>
              {form.type === 'Cooked'
                ? [['1','h','+1 Hr'],['4','h','+4 Hrs'],['1','d','+1 Day']].map(([n,u,l]) => (
                    <TouchableOpacity key={l} style={S.qBtn}
                      onPress={() => setField('expiry', future(+n, u))}>
                      <Text style={S.qBtnT}>{l}</Text>
                    </TouchableOpacity>
                  ))
                : [['7','d','+1 Wk'],['30','d','+1 Mo'],['365','d','+1 Yr']].map(([n,u,l]) => (
                    <TouchableOpacity key={l} style={S.qBtn}
                      onPress={() => setField('expiry', future(+n, u))}>
                      <Text style={S.qBtnT}>{l}</Text>
                    </TouchableOpacity>
                  ))
              }
            </View>
          </View>

          {/* Save / Cancel */}
          <TouchableOpacity
            style={[S.saveBtn, saving && S.disabled]}
            disabled={saving}
            onPress={saveItem}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.saveBtnT}>💾 Save to Pantry</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={S.cancelBtn}
            onPress={() => { setForm(EMPTY); setMode('view'); setScanner(false); }}
          >
            <Text style={S.cancelBtnT}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:       { flex: 1, backgroundColor: '#f0f4f8', paddingHorizontal: 16, paddingTop: 20 },
  header:     { fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#2c3e50', marginBottom: 20 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  addBtn:     { backgroundColor: '#3498db', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20, elevation: 3 },
  addBtnT:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty:      { alignItems: 'center', marginTop: 60 },
  emptyT:     { fontSize: 18, color: '#7f8c8d', fontWeight: '600' },
  emptyS:     { fontSize: 13, color: '#bdc3c7', marginTop: 8 },

  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardImg:    { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  cardImgX:   { backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center' },
  cardBody:   { flex: 1 },
  cardName:   { fontSize: 15, fontWeight: '700', color: '#2c3e50' },
  cardMeta:   { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  timer:      { fontSize: 12, fontWeight: '600', color: '#e67e22', marginTop: 3 },
  timerU:     { color: '#e74c3c' },
  timerX:     { color: '#c0392b', fontWeight: '800' },
  cardBtns:   { flexDirection: 'column', gap: 6 },
  btnG:       { backgroundColor: '#eafaf1', borderRadius: 8, padding: 8, alignItems: 'center' },
  btnR:       { backgroundColor: '#fdf2f2', borderRadius: 8, padding: 8, alignItems: 'center' },
  iconT:      { fontSize: 16 },

  modalBg:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalImg:   { width: '92%', height: '80%' },
  modalX:     { position: 'absolute', top: 44, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  modalXT:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  form:       { backgroundColor: '#fff', borderRadius: 18, padding: 20, elevation: 3 },
  formT:      { fontSize: 20, fontWeight: '800', color: '#2c3e50', marginBottom: 18, textAlign: 'center' },
  sec:        { marginBottom: 22 },
  secT:       { fontSize: 15, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  lbl:        { fontSize: 14, fontWeight: '600', color: '#34495e', marginBottom: 6 },
  hint:       { fontSize: 12, color: '#95a5a6', marginBottom: 10 },
  input:      { borderWidth: 1.5, borderColor: '#dce1e7', backgroundColor: '#fafbfc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2c3e50' },
  pickerWrap: { borderWidth: 1.5, borderColor: '#dce1e7', borderRadius: 10, backgroundColor: '#fafbfc', overflow: 'hidden' },

  outBtn:     { borderWidth: 1.5, borderColor: '#3498db', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginBottom: 10 },
  outBtnT:    { color: '#3498db', fontWeight: '600', fontSize: 14 },
  scanBox:    { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#dce1e7' },
  scanHint:   { textAlign: 'center', fontSize: 12, color: '#95a5a6', padding: 6, backgroundColor: '#f8f9fa' },

  btnPurple:  { backgroundColor: '#9b59b6', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnPurpleT: { color: '#fff', fontWeight: '600', fontSize: 14 },

  imgRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  imgWrap:    { position: 'relative' },
  imgThumb:   { width: 80, height: 80, borderRadius: 10 },
  imgX:       { position: 'absolute', top: -6, right: -6, backgroundColor: '#e74c3c', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  imgXT:      { color: '#fff', fontSize: 10, fontWeight: '800' },
  imgAdd:     { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: '#ccc', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  imgAddT:    { fontSize: 11, textAlign: 'center', color: '#7f8c8d', lineHeight: 18 },

  btnAI:      { backgroundColor: '#8e44ad', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnAIT:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  quickRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  qBtn:       { backgroundColor: '#eaf4fd', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#aed6f1' },
  qBtnT:      { color: '#2980b9', fontWeight: '600', fontSize: 13 },

  saveBtn:    { backgroundColor: '#27ae60', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, elevation: 2 },
  saveBtnT:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn:  { alignItems: 'center', paddingVertical: 14 },
  cancelBtnT: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },

  disabled:   { opacity: 0.4 },
});
