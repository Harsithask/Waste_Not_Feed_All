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
const GROQ_API_KEY = 'you_groq_api_key';

// ─────────────────────────────────────────────────────
// Safe alert wrapper
// ─────────────────────────────────────────────────────
const show = (title, msg) => {
  try { Alert.alert(String(title), String(msg ?? '')); }
  catch (e) { console.error('[ALERT FAILED]', title, msg, e); }
};

// ─────────────────────────────────────────────────────
// Convert image URI → base64
// ─────────────────────────────────────────────────────
const toBase64 = async (uri) => {
  const r    = await fetch(uri);
  const blob = await r.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror  = () => reject(new Error('FileReader failed'));
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

  const loadPantry = async () => {
    setPageLoad(true);
    try {
      const { data, error } = await supabase
        .from('household_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data ?? []);
    } catch (e) { show('Load Error', e.message); }
    setPageLoad(false);
  };

  const future = (n, unit) => {
    const d = new Date();
    if (unit === 'h') d.setHours(d.getHours() + n);
    if (unit === 'd') d.setDate(d.getDate() + n);
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().slice(0, 5)}`;
  };

  const niceDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ══════════════════════════════════════════════════
  //  1. BARCODE LOOKUP
  // ══════════════════════════════════════════════════
  const lookupBarcode = (barcode) => {
    const code = (barcode ?? '').trim();
    if (!code) { show('Empty', 'Type or scan a barcode first.'); return; }
    setSearching(true);

    const run = async () => {
      let found = null;
      try {
        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
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
        if (aiData.error) throw new Error(aiData.error.message);
        const aiName = aiData.choices?.[0]?.message?.content?.trim();
        if (aiName && !aiName.toUpperCase().includes('UNKNOWN') && aiName.length > 1 && aiName.length < 100) {
          found = aiName;
        }
      } catch (e) {
        setSearching(false);
        show('Lookup Failed', 'Could not reach Groq AI: ' + e.message);
        return;
      }

      setSearching(false);
      if (found) {
        setForm(prev => ({ ...prev, name: found }));
        show('Product Found ✅', 'Name set to:\n"' + found + '"');
      } else {
        if (typeof window !== 'undefined' && window.confirm) {
          const yes = window.confirm('Barcode ' + code + ' not identified.\n\nClick OK to add a photo — AI can read the name from the label.');
          if (yes) show('Add a Photo', 'Use Camera or Gallery below, then tap "Analyse with AI".');
        } else {
          Alert.alert('Not Found', 'Add a photo of the label and tap "Analyse with AI" to read the name.', [{ text: 'OK' }]);
        }
      }
    };

    run().catch(e => { setSearching(false); show('Lookup Failed', e.message); });
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
      if (!res.canceled) setField('images', [...form.images, res.assets[0].uri]);
    };
    run().catch(e => show('Image picker error', e.message));
  };

  const removeImage = (i) => setField('images', form.images.filter((_, idx) => idx !== i));

  // ══════════════════════════════════════════════════
  //  3. AI ANALYSIS
  // ══════════════════════════════════════════════════
  const analyseWithAI = () => {
    if (form.images.length === 0) { show('No images', 'Add at least one photo first.'); return; }
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      show('Groq Key Missing', '1. Go to https://console.groq.com\n2. Sign up free\n3. Create API Key\n4. Paste in ScanScreen.js line 20');
      return;
    }
    setAnalysing(true);
    const run = async () => {
      const b64s = [];
      for (const uri of form.images) b64s.push(await toBase64(uri));

      const today = new Date().toISOString().split('T')[0];
      const prompt = `Analyse this food image for an Indian kitchen app.
Return ONLY a raw JSON object — no markdown, no backticks, no extra text.
{"name":"string or null","type":"Packed or Cooked or null","expiry":"YYYY-MM-DD HH:mm or null","notes":"string or null"}
Rules:
- name: read product name from label. For cooked food describe it. null if unreadable.
- type: "Packed" for sealed product, "Cooked" for home-cooked. null if unsure.
- expiry: read from label if visible. Cooked: rice/dal/curry=today+1day, meat=today+1day, baked=today+3days. Packed no date: null.
- notes: brief observation or null.
- Today is ${today}.
Return ONLY the JSON.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 300,
          messages: [{ role: 'user', content: [
            ...b64s.map(b => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b}` } })),
            { type: 'text', text: prompt },
          ]}],
        }),
      });

      const resText = await res.text();
      let resData;
      try { resData = JSON.parse(resText); } catch { throw new Error('Invalid response: ' + resText.slice(0, 100)); }
      if (resData.error) throw new Error('Groq error: ' + resData.error.message);

      const raw = resData.choices?.[0]?.message?.content?.trim() ?? '';
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
      catch { throw new Error('Could not parse AI response:\n' + raw); }

      const updates = {}, filled = [], missing = [];
      if (parsed.name)   { updates.name   = parsed.name.trim();   filled.push('Name: ' + updates.name); }   else { missing.push('Product name'); }
      if (parsed.type === 'Packed' || parsed.type === 'Cooked') { updates.type = parsed.type; filled.push('Type: ' + updates.type); } else { missing.push('Type'); }
      if (parsed.expiry) { updates.expiry = parsed.expiry.trim(); filled.push('Expiry: ' + updates.expiry); } else { missing.push('Expiry date'); }

      setForm(prev => ({ ...prev, ...updates }));
      const msg = (filled.length ? '✅ Filled:\n' + filled.join('\n') : 'Nothing filled.')
        + (missing.length ? '\n\n⚠️ Fill manually:\n' + missing.map(m => '• ' + m).join('\n') : '')
        + (parsed.notes ? '\n\nNote: ' + parsed.notes : '');
      show('AI Analysis Complete', msg);
    };
    run().catch(e => show('AI Failed', e.message)).finally(() => setAnalysing(false));
  };

  // ══════════════════════════════════════════════════
  //  4. SAVE TO SUPABASE
  // ══════════════════════════════════════════════════
  const saveItem = () => {
    const name   = (form.name   ?? '').trim();
    const expiry = (form.expiry ?? '').trim();
    if (!name)   { show('Name required',   'Please enter the product name.'); return; }
    if (!expiry) { show('Expiry required', 'Please enter the expiry date.');  return; }
    const expiryDate = new Date(expiry.replace(' ', 'T'));
    if (isNaN(expiryDate.getTime())) { show('Invalid date', 'Use format: YYYY-MM-DD HH:mm'); return; }
    setSaving(true);
    const run = async () => {
      const urls = [];
      for (const uri of form.images) {
        try {
          const r = await fetch(uri); const blob = await r.blob();
          const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `pantry_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage.from('pantry_images').upload(fileName, blob, { contentType: blob.type || 'image/jpeg' });
          if (!upErr) { const { data: pub } = supabase.storage.from('pantry_images').getPublicUrl(fileName); urls.push(pub.publicUrl); }
        } catch (e) { console.warn('image skip:', e.message); }
      }
      const { error: dbErr } = await supabase.from('household_inventory').insert([{
        name, type: form.type, expiry: expiryDate.toISOString(), image_url: urls[0] ?? null,
      }]).select();
      if (dbErr) throw new Error(dbErr.message);
      show('Saved! ✅', '"' + name + '" added to your pantry.');
      setForm(EMPTY); setMode('view'); setScanner(false); loadPantry();
    };
    run().catch(e => show('Save Failed', e.message)).finally(() => setSaving(false));
  };

  // ══════════════════════════════════════════════════
  //  5. DELETE
  // ══════════════════════════════════════════════════
  const deleteItem = (id, name) => {
    const doDelete = () => {
      supabase.from('household_inventory').delete().eq('id', id)
        .then(({ error }) => {
          if (error) show('Delete failed', error.message);
          else { setItems(prev => prev.filter(i => i.id !== id)); show('Deleted', '"' + name + '" removed.'); }
        }).catch(e => show('Delete error', e.message));
    };
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Delete "' + name + '" from your pantry?')) doDelete();
    } else {
      Alert.alert('Delete?', 'Remove "' + name + '"?', [
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
      const { error } = await supabase.from('donations').insert([{ name: item.name, expiry: item.expiry }]);
      if (error) { show('Donate failed', error.message); return; }
      await supabase.from('household_inventory').delete().eq('id', item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      show('Donated! 💚', '"' + item.name + '" moved to the community feed.');
    };
    run().catch(e => show('Donate error', e.message));
  };

  const cardImg = (item) => item.image_urls?.[0] ?? item.image_url ?? null;

  if (pageLoad) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color="#1a3d2e" />
        <Text style={S.loadingText}>Loading pantry…</Text>
      </View>
    );
  }

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <View style={S.root}>
      {/* ── Header ── */}
      <View style={S.header}>
        <Text style={S.headerSub}>HOUSEHOLD DASHBOARD</Text>
        <Text style={S.headerTitle}>Waste Not, Feed All</Text>
        <View style={S.headerStats}>
          <View style={S.statItem}>
            <Text style={S.statNum}>{items.length}</Text>
            <Text style={S.statLabel}>Items</Text>
          </View>
          <View style={S.statDivider} />
          <View style={S.statItem}>
            <Text style={S.statNum}>{items.filter(i => new Date(i.expiry) > new Date()).length}</Text>
            <Text style={S.statLabel}>Fresh</Text>
          </View>
          <View style={S.statDivider} />
          <View style={S.statItem}>
            <Text style={S.statNum}>{items.filter(i => new Date(i.expiry) <= new Date()).length}</Text>
            <Text style={S.statLabel}>Expired</Text>
          </View>
        </View>
      </View>

      {/* ── Full-screen image modal ── */}
      <Modal visible={!!bigImg} transparent animationType="fade">
        <View style={S.modalBg}>
          <TouchableOpacity style={S.modalX} onPress={() => setBigImg(null)}>
            <Text style={S.modalXT}>✕</Text>
          </TouchableOpacity>
          {bigImg && <Image source={{ uri: bigImg }} style={S.modalImg} resizeMode="contain" />}
        </View>
      </Modal>

      <ScrollView style={S.body} showsVerticalScrollIndicator={false}>

        {/* ════════════ VIEW MODE ════════════ */}
        {mode === 'view' && (
          <View>
            {/* Add button */}
            <TouchableOpacity style={S.addBtn} onPress={() => setMode('add')}>
              <Text style={S.addBtnT}>+ Add Food Item</Text>
            </TouchableOpacity>

            {items.length === 0 && (
              <View style={S.empty}>
                <Text style={S.emptyIcon}>🍽️</Text>
                <Text style={S.emptyT}>Your pantry is empty</Text>
                <Text style={S.emptyS}>Add your first item above</Text>
              </View>
            )}

            {/* Section label */}
            {items.length > 0 && <Text style={S.sectionLabel}>PANTRY ITEMS</Text>}

            {items.map(item => {
              const img = cardImg(item);
              const isExpired = new Date(item.expiry) <= new Date();
              return (
                <TouchableOpacity key={item.id} style={S.card} activeOpacity={0.85}>
                  {/* Left accent bar */}
                  <View style={[S.cardAccent, isExpired && S.cardAccentRed]} />

                  {/* Icon circle */}
                  <View style={S.cardIconWrap}>
                    {img
                      ? <Image source={{ uri: img }} style={S.cardIcon} />
                      : <View style={S.cardIconFallback}>
                          <Text style={S.cardIconText}>
                            {item.name?.charAt(0)?.toUpperCase() || '?'}
                          </Text>
                        </View>
                    }
                  </View>

                  {/* Info */}
                  <View style={S.cardInfo}>
                    <Text style={S.cardName} numberOfLines={1}>{item.name}</Text>
                    <Text style={S.cardSub}>{item.type} · {niceDate(item.expiry)}</Text>
                    <ExpiryTimer expiryDate={item.expiry} />
                  </View>

                  {/* Actions */}
                  <View style={S.cardActions}>
                    <TouchableOpacity style={S.actionBtn} onPress={() => donateItem(item)}>
                      <Text style={S.actionBtnT}>💚</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[S.actionBtn, S.actionBtnDel]} onPress={() => deleteItem(item.id, item.name)}>
                      <Text style={S.actionBtnT}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Chevron */}
                  <Text style={S.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 40 }} />
          </View>
        )}

        {/* ════════════ ADD MODE ════════════ */}
        {mode === 'add' && (
          <View>
            {/* Back button */}
            <TouchableOpacity style={S.backBtn} onPress={() => { setForm(EMPTY); setMode('view'); setScanner(false); }}>
              <Text style={S.backBtnT}>← Back to Pantry</Text>
            </TouchableOpacity>

            <Text style={S.sectionLabel}>ADD NEW ITEM</Text>

            {/* ── Barcode Scanner ── */}
            <View style={S.module}>
              <View style={S.moduleHeader}>
                <View style={S.moduleIcon}><Text style={S.moduleIconT}>B</Text></View>
                <View>
                  <Text style={S.moduleName}>Barcode Scanner</Text>
                  <Text style={S.moduleDesc}>Scan product barcode to auto-fill name</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[S.outlineBtn, scanner && S.outlineBtnActive]}
                onPress={() => setScanner(v => !v)}
              >
                <Text style={S.outlineBtnT}>{scanner ? 'Close Scanner' : '📷 Open Barcode Scanner'}</Text>
              </TouchableOpacity>
              {scanner && (
                <View style={S.scanBox}>
                  <BarcodeScannerComponent
                    width="100%"
                    height={200}
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

            {/* ── Product Name ── */}
            <View style={S.module}>
              <View style={S.moduleHeader}>
                <View style={S.moduleIcon}><Text style={S.moduleIconT}>N</Text></View>
                <View>
                  <Text style={S.moduleName}>Product Name *</Text>
                  <Text style={S.moduleDesc}>Type manually or use barcode scanner above</Text>
                </View>
              </View>
              <TextInput
                style={S.input}
                value={form.name}
                onChangeText={t => setField('name', t)}
                placeholder="e.g. Amul Butter, Cooked Rice..."
                placeholderTextColor="#aab"
              />
              <TouchableOpacity
                style={[S.greenBtn, (searching || !form.name.trim()) && S.disabled]}
                disabled={searching || !form.name.trim()}
                onPress={() => lookupBarcode(form.name.trim())}
              >
                {searching
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={S.greenBtnT}>🔍 Lookup Product Name</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Photos + AI ── */}
            <View style={S.module}>
              <View style={S.moduleHeader}>
                <View style={S.moduleIcon}><Text style={S.moduleIconT}>A</Text></View>
                <View>
                  <Text style={S.moduleName}>AI Photo Analysis</Text>
                  <Text style={S.moduleDesc}>Add photo → AI reads name, type & expiry</Text>
                </View>
              </View>

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
                  <TouchableOpacity style={S.imgAdd} onPress={() => pickImage(false)}>
                    <Text style={S.imgAddIcon}>🖼️</Text>
                    <Text style={S.imgAddT}>Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[S.greenBtn, (analysing || form.images.length === 0) && S.disabled]}
                disabled={analysing || form.images.length === 0}
                onPress={analyseWithAI}
              >
                {analysing
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={S.greenBtnT}>Analysing…</Text>
                    </View>
                  : <Text style={S.greenBtnT}>🤖 Analyse with AI</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Category ── */}
            <View style={S.module}>
              <View style={S.moduleHeader}>
                <View style={S.moduleIcon}><Text style={S.moduleIconT}>C</Text></View>
                <View>
                  <Text style={S.moduleName}>Category</Text>
                  <Text style={S.moduleDesc}>Packed product or cooked food</Text>
                </View>
              </View>
              <View style={S.pickerWrap}>
                <Picker
                  selectedValue={form.type}
                  onValueChange={v => setField('type', v)}
                  style={{ color: '#1a3d2e' }}
                >
                  <Picker.Item label="📦 Packed" value="Packed" />
                  <Picker.Item label="🍳 Cooked" value="Cooked" />
                </Picker>
              </View>
            </View>

            {/* ── Expiry ── */}
            <View style={S.module}>
              <View style={S.moduleHeader}>
                <View style={S.moduleIcon}><Text style={S.moduleIconT}>E</Text></View>
                <View>
                  <Text style={S.moduleName}>Expiry Date & Time *</Text>
                  <Text style={S.moduleDesc}>Use quick buttons or type manually</Text>
                </View>
              </View>
              <TextInput
                style={S.input}
                value={form.expiry}
                onChangeText={t => setField('expiry', t)}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor="#aab"
              />
              <View style={S.quickRow}>
                {form.type === 'Cooked'
                  ? [['1','h','+1 Hr'],['4','h','+4 Hrs'],['1','d','+1 Day']].map(([n,u,l]) => (
                      <TouchableOpacity key={l} style={S.qBtn} onPress={() => setField('expiry', future(+n, u))}>
                        <Text style={S.qBtnT}>{l}</Text>
                      </TouchableOpacity>
                    ))
                  : [['7','d','+1 Wk'],['30','d','+1 Mo'],['365','d','+1 Yr']].map(([n,u,l]) => (
                      <TouchableOpacity key={l} style={S.qBtn} onPress={() => setField('expiry', future(+n, u))}>
                        <Text style={S.qBtnT}>{l}</Text>
                      </TouchableOpacity>
                    ))
                }
              </View>
            </View>

            {/* ── Save ── */}
            <TouchableOpacity
              style={[S.saveBtn, saving && S.disabled]}
              disabled={saving}
              onPress={saveItem}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.saveBtnT}>💾 Save to Pantry</Text>}
            </TouchableOpacity>

            {/* ── Cancel ── */}
            <TouchableOpacity style={S.cancelBtn} onPress={() => { setForm(EMPTY); setMode('view'); setScanner(false); }}>
              <Text style={S.cancelBtnT}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────
//  STYLES — matching the dark green NGO dashboard aesthetic
// ─────────────────────────────────────────────────────
const GREEN       = '#1a3d2e';
const GREEN_LIGHT = '#2d6a4f';
const GREEN_ACC   = '#52b788';
const BG          = '#f0f4f1';
const WHITE       = '#ffffff';
const TEXT_DARK   = '#1a2e1e';
const TEXT_MID    = '#4a6741';
const TEXT_LIGHT  = '#8aab8a';
const RED         = '#c0392b';
const ORANGE      = '#e67e22';

const S = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  loadingText:  { marginTop: 12, color: TEXT_MID, fontSize: 14, fontWeight: '500' },

  // ── Header ──
  header:       { backgroundColor: GREEN, paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20 },
  headerSub:    { color: GREEN_ACC, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle:  { color: WHITE, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  headerStats:  { flexDirection: 'row', alignItems: 'center' },
  statItem:     { alignItems: 'center', flex: 1 },
  statNum:      { color: WHITE, fontSize: 22, fontWeight: '800' },
  statLabel:    { color: GREEN_ACC, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider:  { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── Body ──
  body:         { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  // ── Add button ──
  addBtn:       { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 8, elevation: 2 },
  addBtnT:      { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // ── Section label ──
  sectionLabel: { color: TEXT_LIGHT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 16, marginBottom: 10, marginLeft: 2 },

  // ── Empty state ──
  empty:        { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyT:       { fontSize: 18, color: TEXT_DARK, fontWeight: '700' },
  emptyS:       { fontSize: 14, color: TEXT_LIGHT, marginTop: 6 },

  // ── Pantry card ──
  card:         { backgroundColor: WHITE, borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  cardAccent:   { width: 4, alignSelf: 'stretch', backgroundColor: GREEN_ACC },
  cardAccentRed:{ backgroundColor: RED },
  cardIconWrap: { padding: 12 },
  cardIcon:     { width: 44, height: 44, borderRadius: 10 },
  cardIconFallback: { width: 44, height: 44, borderRadius: 10, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  cardIconText: { color: WHITE, fontSize: 18, fontWeight: '800' },
  cardInfo:     { flex: 1, paddingVertical: 12 },
  cardName:     { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  cardSub:      { fontSize: 12, color: TEXT_LIGHT, marginTop: 2 },
  timer:        { fontSize: 12, fontWeight: '600', color: ORANGE, marginTop: 3 },
  timerU:       { color: RED },
  timerX:       { color: RED, fontWeight: '800' },
  cardActions:  { flexDirection: 'column', gap: 4, paddingRight: 4 },
  actionBtn:    { backgroundColor: '#f0f7f1', borderRadius: 8, padding: 7, alignItems: 'center' },
  actionBtnDel: { backgroundColor: '#fdf2f2' },
  actionBtnT:   { fontSize: 15 },
  chevron:      { color: TEXT_LIGHT, fontSize: 22, fontWeight: '300', paddingHorizontal: 10 },

  // ── Modal ──
  modalBg:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalImg:     { width: '92%', height: '80%' },
  modalX:       { position: 'absolute', top: 44, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  modalXT:      { color: WHITE, fontSize: 16, fontWeight: '700' },

  // ── Back button ──
  backBtn:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 4 },
  backBtnT:     { color: GREEN, fontSize: 14, fontWeight: '600' },

  // ── Module card (add form sections) ──
  module:       { backgroundColor: WHITE, borderRadius: 14, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  moduleIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  moduleIconT:  { color: WHITE, fontWeight: '800', fontSize: 15 },
  moduleName:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  moduleDesc:   { fontSize: 12, color: TEXT_LIGHT, marginTop: 1 },

  // ── Input ──
  input:        { borderWidth: 1.5, borderColor: '#dde8dd', backgroundColor: '#f8faf8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT_DARK, marginBottom: 10 },
  pickerWrap:   { borderWidth: 1.5, borderColor: '#dde8dd', borderRadius: 10, backgroundColor: '#f8faf8', overflow: 'hidden' },

  // ── Scanner ──
  outlineBtn:       { borderWidth: 1.5, borderColor: GREEN, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  outlineBtnActive: { backgroundColor: '#e8f5ee' },
  outlineBtnT:      { color: GREEN, fontWeight: '600', fontSize: 14 },
  scanBox:          { borderRadius: 10, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#dde8dd' },
  scanHint:         { textAlign: 'center', fontSize: 12, color: TEXT_LIGHT, padding: 6, backgroundColor: '#f8faf8' },

  // ── Green action button ──
  greenBtn:     { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  greenBtnT:    { color: WHITE, fontWeight: '700', fontSize: 14 },

  // ── Images ──
  imgRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  imgWrap:      { position: 'relative' },
  imgThumb:     { width: 80, height: 80, borderRadius: 10 },
  imgX:         { position: 'absolute', top: -6, right: -6, backgroundColor: RED, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  imgXT:        { color: WHITE, fontSize: 10, fontWeight: '800' },
  imgAdd:       { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: '#c0d4c0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f7f1' },
  imgAddIcon:   { fontSize: 20 },
  imgAddT:      { fontSize: 10, color: TEXT_MID, fontWeight: '600', marginTop: 3 },

  // ── Quick expiry buttons ──
  quickRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  qBtn:         { backgroundColor: '#e8f5ee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#b7d9c2' },
  qBtnT:        { color: GREEN_LIGHT, fontWeight: '600', fontSize: 13 },

  // ── Save / Cancel ──
  saveBtn:      { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 6, elevation: 2 },
  saveBtnT:     { color: WHITE, fontWeight: '700', fontSize: 16 },
  cancelBtn:    { alignItems: 'center', paddingVertical: 14 },
  cancelBtnT:   { color: RED, fontWeight: '600', fontSize: 14 },

  disabled:     { opacity: 0.4 },
});