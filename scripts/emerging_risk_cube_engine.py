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
SYNERGY_FACTOR = 1.15  # Sinergia crítica cuando X >= 4 y Z >= 4
MAX_NF_CONTROL_EFF = 0.20  # Tope Art. 88 CUB para controles no formalizados


def compute_cube_zone(volume: float, x: float, y: float, z: float, tension: float) -> str:
    """
    Clasifica en una de las 4 zonas del Cubo 3D de B×+:
      RED: Crítico Sistémico
      ORANGE: Alerta Temprana
      YELLOW: Vigilancia / Incubación
      GREEN: Latente / Controlado
    """
    if volume >= 64.0 or (x >= 3.8 and z >= 3.8) or tension >= 68.0:
        return "RED"
    elif volume >= 36.0 or x >= 4.8 or z >= 4.8 or tension >= 45.0:
        return "ORANGE"
    elif volume >= 15.0 or tension >= 22.0:
        return "YELLOW"
    else:
        return "GREEN"


def compute_3d_tension(v_res: float, x_res: float, y_res: float, z_res: float) -> Tuple[float, float]:
    """
    Calcula el Índice Compuesto de Tensión Tridimensional T_3D [1.0, 100.0]
    y el Score Homologado en escala 25 S_eq25 [1.0, 25.0]
    """
    gamma = SYNERGY_FACTOR if (x_res >= 3.8 and z_res >= 3.8) else 1.0
    
    vol_term = 0.45 * (v_res / 125.0)
    quad_term = 0.55 * (
        (WEIGHT_X * (x_res ** 2) + WEIGHT_Y * (y_res ** 2) + WEIGHT_Z * (z_res ** 2)) / 25.0
    )
    
    raw_tension = (vol_term + quad_term) * 100.0 * gamma
    t_3d = min(100.0, max(1.0, round(raw_tension, 1)))
    s_eq25 = min(25.0, max(1.0, round(t_3d / 4.0, 1)))
    
    return t_3d, s_eq25


def calculate_axis_mitigation(
    x_inh: float,
    y_inh: float,
    z_inh: float,
    controls: List[Dict[str, Any]]
) -> Tuple[float, float, float, float, float, float, bool, bool]:
    """
    Aplica la mitigación vectorial diferenciada en los 3 ejes según Art. 88 CUB.
    Retorna (x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime_control, has_nf_penalty)
    """
    has_realtime_control = False
    has_nf_penalty = False
    
    eff_x_sum = 0.0
    eff_y_sum = 0.0
    eff_z_sum = 0.0
    
    for c in controls:
        raw_eff = float(c.get("rawEffectiveness", 3)) / 5.0  # 0.0 - 1.0
        is_formal = bool(c.get("isFormalized", False))
        has_evid = bool(c.get("hasValidEvidence", False))
        
        # Penalización Art. 88 CUB si el control no está formalizado o carece de evidencia
        if not is_formal or not has_evid:
            has_nf_penalty = True
            eff = min(raw_eff, MAX_NF_CONTROL_EFF)
        else:
            eff = raw_eff
            
        automation = str(c.get("automation", "")).upper()
        timing = str(c.get("executionTiming", "")).upper()
        nature = str(c.get("nature", "")).upper()
        
        is_auto_rt = (automation == "AUTOMATED" and timing == "ONLINE_REALTIME")
        if is_auto_rt:
            has_realtime_control = True
            
        # Ponderación al Eje X (Aislamiento, Redundancia, BCP)
        eff_x_sum += eff * 0.35
        
        # Ponderación al Eje Y (Incertidumbre: monitoreo KRI, detección temprana)
        eff_y_sum += eff * 0.30
        
        # Ponderación al Eje Z (Velocidad: requiere automatización en tiempo real)
        if z_inh >= 4.0:
            if is_auto_rt:
                eff_z_sum += eff * 0.45
            else:
                # Los controles manuales o diferidos no pueden desacelerar un ataque de segundos
                eff_z_sum += eff * 0.08
        else:
            eff_z_sum += eff * 0.25
            
    # Factores máximos de contención
    factor_x = min(0.45, eff_x_sum)
    factor_y = min(0.40, eff_y_sum)
    factor_z = min(0.45 if has_realtime_control or z_inh < 4.0 else 0.12, eff_z_sum)
    
    x_res = max(1.0, round(x_inh * (1.0 - factor_x), 2))
    y_res = max(1.0, round(y_inh * (1.0 - factor_y), 2))
    z_res = max(1.0, round(z_inh * (1.0 - factor_z), 2))
    
    delta_x = round(x_inh - x_res, 2)
    delta_y = round(y_inh - y_res, 2)
    delta_z = round(z_inh - z_res, 2)
    
    return x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime_control, has_nf_penalty


def process_single_risk(risk: Dict[str, Any]) -> Dict[str, Any]:
    """
    Procesa un riesgo emergente completo en el Cubo 3D.
    """
    x_inh = float(risk.get("systemicImpactX", 3))
    y_inh = float(risk.get("uncertaintyY", 3))
    z_inh = float(risk.get("materializationSpeedZ", 3))
    
    # Validar rangos 1..5
    x_inh = max(1.0, min(5.0, x_inh))
    y_inh = max(1.0, min(5.0, y_inh))
    z_inh = max(1.0, min(5.0, z_inh))
    
    controls = risk.get("controls", [])
    
    # 1. Coordenadas residuales y mitigación vectorial
    x_res, y_res, z_res, delta_x, delta_y, delta_z, has_realtime, has_nf = calculate_axis_mitigation(
        x_inh, y_inh, z_inh, controls
    )
    
    # Si el payload ya suministra overrides manuales de residuales (simulador), respetarlos
    if "overrideResidualX" in risk and risk["overrideResidualX"] is not None:
        x_res = max(1.0, min(5.0, float(risk["overrideResidualX"])))
        delta_x = round(x_inh - x_res, 2)
    if "overrideResidualY" in risk and risk["overrideResidualY"] is not None:
        y_res = max(1.0, min(5.0, float(risk["overrideResidualY"])))
        delta_y = round(y_inh - y_res, 2)
    if "overrideResidualZ" in risk and risk["overrideResidualZ"] is not None:
        z_res = max(1.0, min(5.0, float(risk["overrideResidualZ"])))
        delta_z = round(z_inh - z_res, 2)
        
    # 2. Volúmenes cúbicos
    vol_inh = round(x_inh * y_inh * z_inh, 2)
    vol_res = round(x_res * y_res * z_res, 2)
    
    # 3. Tensión y score equivalente
    tension_inh, seq25_inh = compute_3d_tension(vol_inh, x_inh, y_inh, z_inh)
    tension_res, seq25_res = compute_3d_tension(vol_res, x_res, y_res, z_res)
    
    # 4. Zonificación 3D
    zone_inh = compute_cube_zone(vol_inh, x_inh, y_inh, z_inh, tension_inh)
    zone_res = compute_cube_zone(vol_res, x_res, y_res, z_res, tension_res)
    
    # 5. Comparativa Paralela 2D vs 3D (Detección de Puntos Ciegos)
    matrix_2d = risk.get("matrix2D", {})
    zone_2d = str(matrix_2d.get("residualZone", "YELLOW")).upper()
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
        "tensorScore3D": tension_res,
        "tensorScore3DInherent": tension_inh,
        "equivalentScore25": seq25_res,
        "cubeZoneInherent": zone_inh,
        "cubeZoneResidual": zone_res,
        "hasRealtimeControl": has_realtime,
        "hasNFControlPenalty": has_nf,
        "isBlindSpot2Dto3D": is_blind_spot,
        "parallelComparison": {
            "matrix2DZone": zone_2d,
            "cube3DZone": zone_res,
            "discrepancyType": (
                "CRITICAL_BLIND_SPOT" if is_blind_spot and zone_res == "RED"
                else "EARLY_WARNING_BLIND_SPOT" if is_blind_spot
                else "CONGRUENT" if zone_2d == zone_res
                else "OVERESTIMATED_IN_2D" if zone_2d in ["RED", "ORANGE"] and zone_res in ["GREEN", "YELLOW"]
                else "TRANSITIONAL"
            ),
            "blindSpotExplanation": (
                f"El riesgo aparece como {zone_2d} en la matriz 2D debido a baja frecuencia histórica, "
                f"pero su combinación en 3D (Contagio {x_res} x Incertidumbre {y_res} x Velocidad {z_res}) "
                f"genera un volumen residual de {vol_res}/125 en Zona {zone_res}."
                if is_blind_spot else "Coherencia cuantitativa entre la matriz 2D y el cubo 3D."
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
            "avgResidualVolume": avg_vol
        },
        "categorySummary": list(categories_tracker.values()),
        "emergingRisks": processed_risks
    }


def run_unit_test():
    """Prueba unitaria incorporada para validación del motor Python."""
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
            "inherentImpact": 5,
            "residualProbability": 1.2,
            "residualImpact": 4.5,
            "residualScore": 5.4,
            "residualZone": "YELLOW"
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
