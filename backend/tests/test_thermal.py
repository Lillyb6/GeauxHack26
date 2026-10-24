import pytest

from app.thermal import check_thermal_capacity


def test_mars_heater_is_too_small():
    result = check_thermal_capacity(
        inside_c=21,
        outside_c=-59,
        ua_kw_per_k=0.04,
        heating_capacity_kw=2,
        cooling_capacity_kw=0,
        cop=1,
    )

    assert result["mode"] == "heating"
    assert result["required_thermal_kw"] == pytest.approx(3.2)
    assert result["margin_kw"] == pytest.approx(-1.2)
    assert result["capacity_sufficient"] is False


def test_exact_capacity_is_sufficient():
    result = check_thermal_capacity(21, -59, 0.04, 3.2, 0, 1)

    assert result["capacity_sufficient"] is True


def test_cop_changes_electricity_not_heat_requirement():
    first = check_thermal_capacity(21, -59, 0.04, 4, 0, 1)
    second = check_thermal_capacity(21, -59, 0.04, 4, 0, 2)

    assert first["required_thermal_kw"] == second["required_thermal_kw"]
    assert second["required_electric_kw"] == pytest.approx(
        first["required_electric_kw"] / 2
    )


def test_hot_environment_uses_cooling_capacity():
    result = check_thermal_capacity(21, 40, 0.04, 10, 0.5, 1)

    assert result["mode"] == "cooling"
    assert result["required_thermal_kw"] == pytest.approx(0.76)
    assert result["capacity_sufficient"] is False


def test_equal_temperatures_need_no_thermal_control():
    result = check_thermal_capacity(21, 21, 0.04, 0, 0, 1)

    assert result["mode"] == "none"
    assert result["required_electric_kw"] == 0
    assert result["capacity_sufficient"] is True


@pytest.mark.parametrize(
    "field,value",
    [
        ("ua_kw_per_k", -1),
        ("heating_capacity_kw", -1),
        ("cooling_capacity_kw", -1),
        ("cop", 0),
        ("inside_c", float("nan")),
        ("outside_c", float("inf")),
    ],
)
def test_invalid_inputs_are_rejected(field, value):
    inputs = {
        "inside_c": 21,
        "outside_c": -59,
        "ua_kw_per_k": 0.04,
        "heating_capacity_kw": 4,
        "cooling_capacity_kw": 0,
        "cop": 1,
    }
    inputs[field] = value

    with pytest.raises(ValueError):
        check_thermal_capacity(**inputs)