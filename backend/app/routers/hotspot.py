import math
import random
import datetime
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Query
from app.database import supabase
 
router = APIRouter()
 
 
def _euclidean(a: tuple, b: tuple) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
 
 
def _kmeans(points: list, k: int = 5, max_iter: int = 50) -> list:
    """
    points  : [{"lat": float, "lng": float, "weight": int}, ...]
    returns : list of cluster dicts sorted by total_demand descending
    """
    if not points:
        return []
 
    k = min(k, len(points))
    coords = [(p["lat"], p["lng"]) for p in points]
 
    # K-Means++ style seeding
    random.seed(42)
    centroids = [random.choice(coords)]
    while len(centroids) < k:
        distances = [min(_euclidean(c, cen) ** 2 for cen in centroids) for c in coords]
        total = sum(distances)
        if total == 0:
            break
        r = random.uniform(0, total)
        cumulative = 0.0
        for i, d in enumerate(distances):
            cumulative += d
            if cumulative >= r:
                centroids.append(coords[i])
                break
 
    labels = [0] * len(coords)
 
    for _ in range(max_iter):
        changed = False
        for i, c in enumerate(coords):
            new_label = min(range(k), key=lambda j: _euclidean(c, centroids[j]))
            if new_label != labels[i]:
                labels[i] = new_label
                changed = True
 
        if not changed:
            break
 
        for j in range(k):
            cluster_pts = [coords[i] for i in range(len(coords)) if labels[i] == j]
            if cluster_pts:
                centroids[j] = (
                    sum(p[0] for p in cluster_pts) / len(cluster_pts),
                    sum(p[1] for p in cluster_pts) / len(cluster_pts),
                )
 
    cluster_weight = defaultdict(int)
    cluster_count  = defaultdict(int)
    for i, p in enumerate(points):
        cluster_weight[labels[i]] += p.get("weight", 1)
        cluster_count[labels[i]]  += 1
 
    results = []
    for j in range(k):
        if cluster_count[j] == 0:
            continue
        results.append({
            "cluster_id":   j,
            "centroid_lat": round(centroids[j][0], 6),
            "centroid_lng": round(centroids[j][1], 6),
            "point_count":  cluster_count[j],
            "total_demand": cluster_weight[j],
            "intensity":    round(min(1.0, cluster_weight[j] / 80), 3),
        })
 
    return sorted(results, key=lambda c: c["total_demand"], reverse=True)
 
 
def _fetch_demand_points() -> list:
    rows = []
 
    # Primary: food_requests table
    try:
        res = supabase.table("food_requests") \
            .select("latitude, longitude, quantity, status") \
            .execute()
        rows = res.data or []
    except Exception:
        pass
 
    # Fallback: donations table
    if not rows:
        try:
            res = supabase.table("donations") \
                .select("latitude, longitude, status") \
                .in_("status", ["available", "Available", "pending", "Pending"]) \
                .execute()
            rows = [{**r, "quantity": 1} for r in (res.data or [])]
        except Exception:
            pass
 
    points = []
    for r in rows:
        try:
            lat = float(r.get("latitude") or 0)
            lng = float(r.get("longitude") or 0)
            if lat == 0.0 and lng == 0.0:
                continue
            points.append({
                "lat":    lat,
                "lng":    lng,
                "weight": max(1, int(r.get("quantity") or 1)),
            })
        except (TypeError, ValueError):
            continue
 
    return points
 
 
def _fetch_supply_near(lat: float, lng: float, radius_deg: float = 0.15) -> int:
    try:
        res = supabase.table("donations") \
            .select("quantity, status") \
            .gte("latitude",  lat - radius_deg) \
            .lte("latitude",  lat + radius_deg) \
            .gte("longitude", lng - radius_deg) \
            .lte("longitude", lng + radius_deg) \
            .in_("status", ["available", "Available", "scheduled", "Scheduled"]) \
            .execute()
        return sum(max(1, int(r.get("quantity") or 1)) for r in (res.data or []))
    except Exception:
        return 0
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════
 
@router.post("/analyze")
def analyze_hotspots(k: int = Query(default=5, ge=2, le=15)):
    points = _fetch_demand_points()
 
    if len(points) < 2:
        return {
            "clusters":              [],
            "red_zones":             [],
            "total_points_analyzed": len(points),
            "message": (
                "Not enough geo-tagged data yet. "
                "Press 'Seed Demo' to add test data, "
                "or ensure your donations/food_requests rows have latitude & longitude."
            ),
        }
 
    raw_clusters = _kmeans(points, k=k)
 
    RED_ZONE_THRESHOLD = 60
 
    enriched = []
    for idx, c in enumerate(raw_clusters):
        supply   = _fetch_supply_near(c["centroid_lat"], c["centroid_lng"])
        demand   = c["total_demand"]
        gap      = max(0, demand - supply)
        gap_pct  = round((gap / demand * 100), 1) if demand > 0 else 0.0
        red_zone = gap_pct >= RED_ZONE_THRESHOLD
 
        enriched.append({
            **c,
            "zone_label":       f"Sector {idx + 1}",
            "scheduled_supply": supply,
            "supply_gap":       gap,
            "gap_percentage":   gap_pct,
            "red_zone":         red_zone,
            "severity": (
                "critical" if gap_pct >= 80
                else "high"     if gap_pct >= 60
                else "moderate" if gap_pct >= 30
                else "safe"
            ),
        })
 
    now = datetime.datetime.utcnow().isoformat()
    try:
        upsert_rows = [{
            "zone_label":       e["zone_label"],
            "centroid_lat":     e["centroid_lat"],
            "centroid_lng":     e["centroid_lng"],
            "total_demand":     e["total_demand"],
            "scheduled_supply": e["scheduled_supply"],
            "supply_gap":       e["supply_gap"],
            "gap_percentage":   e["gap_percentage"],
            "red_zone":         e["red_zone"],
            "severity":         e["severity"],
            "point_count":      e["point_count"],
            "updated_at":       now,
        } for e in enriched]
 
        supabase.table("hotspot_clusters") \
            .upsert(upsert_rows, on_conflict="zone_label") \
            .execute()
    except Exception as err:
        print(f"[hotspot] Persist failed (run SQL migration): {err}")
 
    return {
        "clusters":              enriched,
        "red_zones":             [e["zone_label"] for e in enriched if e["red_zone"]],
        "total_points_analyzed": len(points),
        "k":                     k,
        "analyzed_at":           now,
    }
 
 
@router.get("/map-data")
def get_map_data():
    points   = _fetch_demand_points()
    clusters = []
 
    try:
        res = supabase.table("hotspot_clusters") \
            .select("*") \
            .order("gap_percentage", desc=True) \
            .execute()
        clusters = res.data or []
    except Exception:
        pass
 
    return {
        "heatmap_points": [
            {"lat": p["lat"], "lng": p["lng"], "weight": p["weight"]}
            for p in points
        ],
        "clusters": clusters,
    }
 
 
@router.get("/alerts")
def get_alerts():
    try:
        res = supabase.table("hotspot_clusters") \
            .select("*") \
            .eq("red_zone", True) \
            .order("gap_percentage", desc=True) \
            .execute()
        red_zones = res.data or []
    except Exception:
        red_zones = []
 
    alerts = []
    for z in red_zones:
        gap = z.get("gap_percentage", 0)
        alerts.append({
            "zone_label":     z["zone_label"],
            "severity":       z.get("severity", "high"),
            "message":        (
                f"⚠️ High Need Detected in {z['zone_label']} — "
                f"{gap:.0f}% of demand is unmet"
            ),
            "centroid_lat":   z.get("centroid_lat"),
            "centroid_lng":   z.get("centroid_lng"),
            "gap_percentage": gap,
            "total_demand":   z.get("total_demand"),
            "supply":         z.get("scheduled_supply"),
            "updated_at":     z.get("updated_at"),
        })
 
    return {"alerts": alerts, "count": len(alerts)}
 
 
@router.post("/seed-demo")
def seed_demo_data():
    """Seeds synthetic Tamil Nadu demand data for testing."""
    base_locations = [
        (13.0827, 80.2707, "Chennai Central",  12),
        (13.0569, 80.2425, "Chennai Tambaram",  8),
        (13.1186, 80.2907, "Chennai Perambur",  9),
        (11.0168, 76.9558, "Coimbatore",        7),
        (10.7905, 78.7047, "Tiruchirappalli",   8),
        (9.9252,  78.1198, "Madurai",           10),
        (8.7139,  77.7567, "Tirunelveli",        6),
        (12.9165, 79.1325, "Vellore",            7),
        (11.6643, 78.1460, "Salem",              5),
        (10.4621, 77.3920, "Dindigul",           4),
    ]
 
    records = []
    random.seed(77)
    for base_lat, base_lng, name, count in base_locations:
        for _ in range(count):
            records.append({
                "latitude":    round(base_lat + random.uniform(-0.04, 0.04), 6),
                "longitude":   round(base_lng + random.uniform(-0.04, 0.04), 6),
                "quantity":    random.randint(2, 25),
                "status":      "pending",
                "description": f"Demo request near {name}",
                "created_at":  datetime.datetime.utcnow().isoformat(),
            })
 
    try:
        supabase.table("food_requests").insert(records).execute()
        return {
            "message":   f"✅ Seeded {len(records)} demo demand points across Tamil Nadu.",
            "count":     len(records),
            "next_step": "Now press 'Run Analysis' to cluster the data.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {e}")