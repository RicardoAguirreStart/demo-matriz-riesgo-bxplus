#!/usr/bin/env python3
"""
scripts/emerging_risk_cube_engine.py

Motor Cuantitativo Tridimensional de Riesgos Emergentes (Cubo 5x5x5)
Grupo Financiero Ve por Más (B×+)
Cumplimiento normativo: CNBV CUB Art. 88, Basilea III, WEF Global Risks Report

Procesa tensores tridimensionales:
  Eje X: Impacto Sistémico y Potencial de Contagio (1..5)
  Eje Y: Incertidumbre Epistémica (1..5)
  Eje Z: Velocidad de Materialización / Time-to-Impact (1..5)
"""

import sys
import json
import math
import argparse
from typing import Dict, List, Any, Tuple

# Constantes de Ponderación Normativa B×+
WEIGHT_X = 0.40  # Contagio / Sistémico
WEIGHT_Y = 0.25  # Incertidumbre
WEIGHT_Z = 0.35  # Velocidad
SYNERGY_FACTOR = 1.15  # Sinergia crítica cuando X >= 4 y Z >= 4 (Ciclo OODA)
MAX_NF_CONTROL_EFF = 0.20  # Tope Art. 88 CUB para controles no formalizados (máx 0.40 en eje)


def compute_cube_zone(volume: float, x: float, y: float, z: float, tension: float) -> str:
    """
    Clasifica en una de las 4 zonas topológicas del Cubo 3D de B×+:
      RED: Crítico Sistémico (V >= 64 o (X >= 4 y Z >= 4) o T_3D >= 68)
      ORANGE: Alerta Temprana (36 <= V < 64 o X = 5 o Z = 5 o T_3D >= 45)
      YELLOW: Vigilancia / Incubación (15 <= V < 36 o T_3D >= 22)
      GREEN: Latente / Controlado (V < 15 y T_3D < 22)
    """
    if volume >= 64.0 or (x >= 3.8 and z >= 3.8) or tension >= 68.0:
        return "RED"
    elif volume >= 36.0 or x >= 4.8 or z >= 4.8 or tension >= 45.0:
        return "ORANGE"
    elif volume >= 15.0 or tension >= 22.0:
        return "YELLOW"
    else:
        return "GREEN"


def compute_3d_tension_breakdown(v_res: float, x_res: float, y_res: float, z_res: float) -> Dict[str, float]:
    """
    Calcula el desglose matemático formal completo del Tensor de Tensión Tridimensional:
      1. Término Volumétrico Normalizado: 0.45 * (V / 125)
      2. Norma Cuadrática Euclidiana Ponderada: (0.40 X^2 + 0.25 Y^2 + 0.35 Z^2) / 25
      3. Aporte Convexo Cuadrático: 0.55 * Norma
      4. Combinación Convexa Base: VolTerm + QuadTerm
      5. Factor de Sinergia Crítica gamma: 1.15 si (X >= 4 y Z >= 4) sino 1.00
      6. Tensor T_3D: min(100.0, convexCombination * 100 * gamma)
      7. Score Homologado S_eq: round(T_3D / 4.0, 2)
    """
    gamma = SYNERGY_FACTOR if (x_res >= 3.8 and z_res >= 3.8) else 1.00
    
    vol_norm_term = round(0.45 * (v_res / 125.0), 4)
    weighted_quad_norm = round(
        (WEIGHT_X * (x_res ** 2) + WEIGHT_Y * (y_res ** 2) + WEIGHT_Z * (z_res ** 2)) / 25.0,
        4
    )
    quad_weighted_term = round(0.55 * weighted_quad_norm, 4)
    convex_comb = round(vol_norm_term + quad_weighted_term, 4)
    
    raw_tension = convex_comb * 100.0 * gamma
    t_3d = min(100.0, max(1.0, round(raw_tension, 2)))
    s_eq25 = min(25.0, max(1.0, round(t_3d / 4.0, 2)))
    
    return {
        "volNormalizedTerm": vol_norm_term,
        "weightedQuadraticNorm": weighted_quad_norm,
        "quadWeightedTerm": quad_weighted_term,
        "convexCombination": convex_comb,
        "synergyFactorGamma": gamma,
        "tensorScore3D": t_3d,
        "equivalentScore25": s_eq25,
    }


def compute_3d_tension(v_res: float, x_res: float, y_res: float, z_res: float) -> Tuple[float, float]:
    """Helper simple que retorna (T_3D, S_eq)."""
    b = compute_3d_tension_breakdown(v_res, x_res, y_res, z_res)
    return b["tensorScore3D"], b["equivalentScore25"]


def calculate_axis_mitigation(
    x_inh: float,
    y_inh: float,
    z_inh: float,
    controls: List[Dict[str, Any]],
    force_nf: bool = False
) -> Tuple[float, float, float, float, float, float, bool, bool]:
    """
    Aplica el álgebra de mitigación vectorial en los 3 ejes según Art. 88 CUB:
      R_res = max([1, 1, 1]^T, R_inh - Delta_R)
    Retorna: (x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime_control, has_nf_penalty)
    """
    has_realtime_control = False
    has_nf_penalty = False
    
    eff_x_sum = 0.0
    eff_y_sum = 0.0
    eff_z_sum = 0.0
    
    for c in controls:
        raw_eff = float(c.get("rawEffectiveness", 3)) / 5.0  # 0.0 - 1.0
        is_formal = bool(c.get("isFormalized", False)) and not force_nf
        has_evid = bool(c.get("hasValidEvidence", False)) and not force_nf
        
        # Penalización y truncamiento Art. 88 CUB si el control es No Formalizado (NF)
        if not is_formal or not has_evid or force_nf:
            has_nf_penalty = True
            eff = min(raw_eff, MAX_NF_CONTROL_EFF)  # máximo 20%
        else:
            eff = raw_eff
            
        automation = str(c.get("automation", "")).upper()
        timing = str(c.get("executionTiming", "")).upper()
        
        is_auto_rt = (automation == "AUTOMATED" and timing == "ONLINE_REALTIME")
        if is_auto_rt:
            has_realtime_control = True
            
        # Ponderación al Eje X (Aislamiento, Redundancia BCP, Segmentación)
        eff_x_sum += eff * 0.45
        
        # Ponderación al Eje Y (Incertidumbre: sensores KRI, threat intelligence, modelos)
        eff_y_sum += eff * 0.40
        
        # Ponderación al Eje Z (Velocidad: exige automatización en tiempo real)
        if z_inh >= 3.8:
            if is_auto_rt:
                eff_z_sum += eff * 0.45
            else:
                # Condición de falla: los controles manuales/diferidos no pueden frenar velocidad relámpago
                eff_z_sum += 0.0
        else:
            eff_z_sum += eff * 0.25
            
    # Truncamiento Art. 88 CUB: Controles NF se topan a 0.40 de absorción efectiva
    if has_nf_penalty:
        eff_x_sum = min(eff_x_sum, 0.40)
        eff_y_sum = min(eff_y_sum, 0.40)
        eff_z_sum = min(eff_z_sum, 0.40)
        
    delta_x = round(min(x_inh - 1.0, max(0.0, eff_x_sum * (x_inh - 1.0))), 2)
    delta_y = round(min(y_inh - 1.0, max(0.0, eff_y_sum * (y_inh - 1.0))), 2)
    delta_z = round(min(z_inh - 1.0, max(0.0, eff_z_sum * (z_inh - 1.0))), 2)
    
    x_res = max(1.0, round(x_inh - delta_x, 2))
    y_res = max(1.0, round(y_inh - delta_y, 2))
    z_res = max(1.0, round(z_inh - delta_z, 2))
    
    return x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime_control, has_nf_penalty


def process_single_risk(risk: Dict[str, Any]) -> Dict[str, Any]:
    """
    Procesa un riesgo emergente completo en el Cubo 3D con todo el desglose matemático formal.
    """
    x_inh = float(risk.get("systemicImpactX", 3))
    y_inh = float(risk.get("uncertaintyY", 3))
    z_inh = float(risk.get("materializationSpeedZ", 3))
    
    # Validar rangos 1..5
    x_inh = max(1.0, min(5.0, x_inh))
    y_inh = max(1.0, min(5.0, y_inh))
    z_inh = max(1.0, min(5.0, z_inh))
    
    controls = risk.get("controls", [])
    force_nf = bool(risk.get("forceNF", False))
    
    # 1. Coordenadas residuales y mitigación vectorial
    x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime, has_nf = calculate_axis_mitigation(
        x_inh, y_inh, z_inh, controls, force_nf=force_nf
    )
    
    # Si el payload suministra traslación vectorial simulada explícita (DeltaX, DeltaY, DeltaZ)
    if "overrideDeltaX" in risk and risk["overrideDeltaX"] is not None:
        delta_x = round(float(risk["overrideDeltaX"]), 2)
        if force_nf:
            delta_x = min(delta_x, 0.40)
        x_res = max(1.0, min(5.0, round(x_inh - delta_x, 2)))
        
    if "overrideDeltaY" in risk and risk["overrideDeltaY"] is not None:
        delta_y = round(float(risk["overrideDeltaY"]), 2)
        if force_nf:
            delta_y = min(delta_y, 0.40)
        y_res = max(1.0, min(5.0, round(y_inh - delta_y, 2)))
        
    if "overrideDeltaZ" in risk and risk["overrideDeltaZ"] is not None:
        delta_z = round(float(risk["overrideDeltaZ"]), 2)
        if force_nf:
            delta_z = min(delta_z, 0.40)
        # Condición de falla: si Z >= 4 y no hay realtime control, no puede haber reducción en Z
        if z_inh >= 3.8 and not has_realtime and not risk.get("simHasRealtimeControl", False):
            delta_z = 0.0
        z_res = max(1.0, min(5.0, round(z_inh - delta_z, 2)))
        
    # Si el payload suministra directamente overrides residuales (ej. desde sliders directos de coordenadas)
    if "overrideResidualX" in risk and risk["overrideResidualX"] is not None and "overrideDeltaX" not in risk:
        x_res = max(1.0, min(5.0, float(risk["overrideResidualX"])))
        delta_x = round(x_inh - x_res, 2)
    if "overrideResidualY" in risk and risk["overrideResidualY"] is not None and "overrideDeltaY" not in risk:
        y_res = max(1.0, min(5.0, float(risk["overrideResidualY"])))
        delta_y = round(y_inh - y_res, 2)
    if "overrideResidualZ" in risk and risk["overrideResidualZ"] is not None and "overrideDeltaZ" not in risk:
        z_res = max(1.0, min(5.0, float(risk["overrideResidualZ"])))
        delta_z = round(z_inh - z_res, 2)
        
    # 2. Volúmenes cúbicos
    vol_inh = round(x_inh * y_inh * z_inh, 2)
    vol_res = round(x_res * y_res * z_res, 2)
    
    # 3. Desglose completo de tensión y score equivalente
    breakdown_inh = compute_3d_tension_breakdown(vol_inh, x_inh, y_inh, z_inh)
    breakdown_res = compute_3d_tension_breakdown(vol_res, x_res, y_res, z_res)
    
    # 4. Zonificación 3D
    zone_inh = compute_cube_zone(vol_inh, x_inh, y_inh, z_inh, breakdown_inh["tensorScore3D"])
    zone_res = compute_cube_zone(vol_res, x_res, y_res, z_res, breakdown_res["tensorScore3D"])
    
    # 5. Comparativa Paralela 2D vs 3D (Brecha de Visibilidad Delta_vis)
    matrix_2d = risk.get("matrix2D", {})
    p_res = float(matrix_2d.get("residualProbability", matrix_2d.get("inherentProbability", 1.0)))
    i_res = float(matrix_2d.get("residualImpact", matrix_2d.get("inherentImpact", 1.0)))
    score_2d = float(matrix_2d.get("residualScore", round(p_res * i_res, 2)))
    zone_2d = str(matrix_2d.get("residualZone", "YELLOW")).upper()
    
    # Brecha de Visibilidad formal: Delta_vis = S_eq(3D) - Score_2D
    visibility_gap = round(breakdown_res["equivalentScore25"] - score_2d, 2)
    is_blind_spot = (zone_2d in ["GREEN", "YELLOW"]) and (zone_res in ["ORANGE", "RED"])
    
    return {
        **risk,
        "systemicImpactX": x_inh,
        "uncertaintyY": y_inh,
        "materializationSpeedZ": z_inh,
        "residualX": x_res,
        "residualY": y_res,
        "residualZ": z_res,
        "mitigationDeltaX": delta_x,
        "mitigationDeltaY": delta_y,
        "mitigationDeltaZ": delta_z,
        "volumeInherent": vol_inh,
        "volumeResidual": vol_res,
        # Desglose matemático interno del Tensor 3D
        "volNormalizedTerm": breakdown_res["volNormalizedTerm"],
        "weightedQuadraticNorm": breakdown_res["weightedQuadraticNorm"],
        "quadWeightedTerm": breakdown_res["quadWeightedTerm"],
        "convexCombination": breakdown_res["convexCombination"],
        "synergyFactorGamma": breakdown_res["synergyFactorGamma"],
        "tensorScore3D": breakdown_res["tensorScore3D"],
        "tensorScore3DInherent": breakdown_inh["tensorScore3D"],
        "equivalentScore25": breakdown_res["equivalentScore25"],
        "cubeZoneInherent": zone_inh,
        "cubeZoneResidual": zone_res,
        "hasRealtimeControl": has_realtime or bool(risk.get("simHasRealtimeControl", False)),
        "hasNFControlPenalty": has_nf or force_nf,
        "isBlindSpot2Dto3D": is_blind_spot,
        # Métricas 2D y Brecha de Visibilidad
        "score2D": score_2d,
        "visibilityGapDelta": visibility_gap,
        "parallelComparison": {
            "matrix2DZone": zone_2d,
            "cube3DZone": zone_res,
            "score2D": score_2d,
            "equivalentScore3D": breakdown_res["equivalentScore25"],
            "visibilityGapDelta": visibility_gap,
            "discrepancyType": (
                "CRITICAL_BLIND_SPOT" if is_blind_spot and zone_res == "RED"
                else "EARLY_WARNING_BLIND_SPOT" if is_blind_spot
                else "CONGRUENT" if zone_2d == zone_res
                else "OVERESTIMATED_IN_2D" if zone_2d in ["RED", "ORANGE"] and zone_res in ["GREEN", "YELLOW"]
                else "TRANSITIONAL"
            ),
            "blindSpotExplanation": (
                f"El riesgo aparece como {zone_2d} en 2D (Score: {score_2d}/25), pero su combinación 3D "
                f"(X={x_res}, Y={y_res}, Z={z_res}) produce T_3D={breakdown_res['tensorScore3D']}/100 y S_eq={breakdown_res['equivalentScore25']}/25 "
                f"en Zona {zone_res}, con una Brecha de Visibilidad Δ_vis = +{visibility_gap}."
                if is_blind_spot else f"Coherencia cuantitativa (Δ_vis = {visibility_gap:+0.2f})."
            )
        }
    }


def process_cube_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Procesa el conjunto de riesgos emergentes y genera agregaciones globales.
    """
    risks = payload.get("risks", [])
    processed_risks = [process_single_risk(r) for r in risks]
    
    total = len(processed_risks)
    red_count = sum(1 for r in processed_risks if r["cubeZoneResidual"] == "RED")
    orange_count = sum(1 for r in processed_risks if r["cubeZoneResidual"] == "ORANGE")
    yellow_count = sum(1 for r in processed_risks if r["cubeZoneResidual"] == "YELLOW")
    green_count = sum(1 for r in processed_risks if r["cubeZoneResidual"] == "GREEN")
    
    high_speed_count = sum(1 for r in processed_risks if r["residualZ"] >= 3.8)
    blind_spots_count = sum(1 for r in processed_risks if r["isBlindSpot2Dto3D"])
    
    avg_x = round(sum(r["residualX"] for r in processed_risks) / total, 2) if total > 0 else 0.0
    avg_y = round(sum(r["residualY"] for r in processed_risks) / total, 2) if total > 0 else 0.0
    avg_z = round(sum(r["residualZ"] for r in processed_risks) / total, 2) if total > 0 else 0.0
    avg_vol = round(sum(r["volumeResidual"] for r in processed_risks) / total, 2) if total > 0 else 0.0
    avg_gap = round(sum(r["visibilityGapDelta"] for r in processed_risks) / total, 2) if total > 0 else 0.0
    
    # Desglose por las 8 categorías emergentes
    categories_tracker: Dict[str, Dict[str, Any]] = {}
    for r in processed_risks:
        cat = r.get("emergingCategoryCode", "UNSPECIFIED")
        if cat not in categories_tracker:
            categories_tracker[cat] = {
                "categoryCode": cat,
                "count": 0,
                "redCount": 0,
                "blindSpotCount": 0,
                "sumVol": 0.0,
                "avgVol": 0.0,
                "avgZ": 0.0,
                "risks": []
            }
        categories_tracker[cat]["count"] += 1
        if r["cubeZoneResidual"] == "RED":
            categories_tracker[cat]["redCount"] += 1
        if r["isBlindSpot2Dto3D"]:
            categories_tracker[cat]["blindSpotCount"] += 1
        categories_tracker[cat]["sumVol"] += r["volumeResidual"]
        categories_tracker[cat]["risks"].append(r["code"])
        
    for cat, data in categories_tracker.items():
        if data["count"] > 0:
            data["avgVol"] = round(data["sumVol"] / data["count"], 1)
            
    return {
        "success": True,
        "engine": "Python 3D Cube Engine (v3.5 - CNBV CUB Art. 88)",
        "totalEmergingRisks": total,
        "kpis": {
            "criticalRed3DCount": red_count,
            "orangeCount": orange_count,
            "yellowCount": yellow_count,
            "greenCount": green_count,
            "highSpeedCount": high_speed_count,
            "blindSpots2Dto3DCount": blind_spots_count,
            "avgSystemicX": avg_x,
            "avgUncertaintyY": avg_y,
            "avgSpeedZ": avg_z,
            "avgResidualVolume": avg_vol,
            "avgVisibilityGapDelta": avg_gap
        },
        "categorySummary": list(categories_tracker.values()),
        "emergingRisks": processed_risks
    }


def run_unit_test():
    """Prueba unitaria incorporada para validación del motor Python y desglose matemático."""
    sample_risk = {
        "id": "test-1",
        "code": "RSK-CYBER-006",
        "title": "Ataque Zero-Day con Desvío de Transacciones SPEI en Milisegundos",
        "emergingCategoryCode": "CYBER_ADVANCED",
        "systemicImpactX": 5,
        "uncertaintyY": 4,
        "materializationSpeedZ": 5,
        "controls": [
            {
                "id": "c-1",
                "code": "CTRL-EDR-01",
                "name": "Aislamiento Automático EDR en SOC",
                "isFormalized": True,
                "hasValidEvidence": True,
                "automation": "AUTOMATED",
                "executionTiming": "ONLINE_REALTIME",
                "nature": "PREVENTIVE",
                "rawEffectiveness": 4
            }
        ],
        "matrix2D": {
            "inherentProbability": 1,
            "inherentImpact": 4,
            "residualProbability": 1.0,
            "residualImpact": 4.0,
            "residualScore": 4.0,
            "residualZone": "GREEN"
        }
    }
    
    result = process_cube_payload({"risks": [sample_risk]})
    print(json.dumps(result, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Motor Cuantitativo del Cubo 3D de Riesgos Emergentes (B×+)")
    parser.add_argument("--test", action="store_true", help="Ejecutar prueba de diagnóstico")
    parser.add_argument("--input", type=str, help="Archivo JSON de entrada")
    args = parser.parse_args()
    
    if args.test:
        run_unit_test()
        sys.exit(0)
        
    try:
        if args.input:
            with open(args.input, "r", encoding="utf-8") as f:
                payload = json.load(f)
        else:
            # Leer desde stdin
            raw_input = sys.stdin.read().strip()
            if not raw_input:
                payload = {"risks": []}
            else:
                payload = json.loads(raw_input)
                
        result = process_cube_payload(payload)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        err_res = {
            "success": False,
            "error": f"Error en Motor Python 3D: {str(e)}"
        }
        print(json.dumps(err_res, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
