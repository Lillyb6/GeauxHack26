"""Thermal capacity screening and steady state conduction (simplified)"""

from math import isfinite


def check_thermal_capacity(
    inside_c,
    outside_c,
    ua_kw_per_k,
    heating_capacity_kw,
    cooling_capacity_kw,
    cop,
):
    values = (
        inside_c,
        outside_c,
        ua_kw_per_k,
        heating_capacity_kw,
        cooling_capacity_kw,
        cop,
    )

    if not all(isfinite(value) for value in values):
        raise ValueError("Thermal inputs must be finite numbers.")

    if min(
        ua_kw_per_k,
        heating_capacity_kw,
        cooling_capacity_kw,
    ) < 0:
        raise ValueError("Conductance and capacities cannot be negative.")

    if cop <= 0:
        raise ValueError("COP must be greater than zero.")

    temperature_difference = inside_c - outside_c
    required = ua_kw_per_k * abs(temperature_difference)

    if temperature_difference > 0:
        mode = "heating"
        available = heating_capacity_kw
    elif temperature_difference < 0:
        mode = "cooling"
        available = cooling_capacity_kw
    else:
        mode = "none"
        available = 0.0

    margin = available - required

    return {
        "mode": mode,
        "required_thermal_kw": required,
        "available_thermal_kw": available,
        "margin_kw": margin,
        "capacity_sufficient": margin >= -1e-9,
        "required_electric_kw": required / cop,
    }