import math

from app.core.carbon_engine import (
    calculate_accommodation_co2e,
    calculate_activity_co2e,
    calculate_transport_co2e,
    calculate_trip_co2e,
)


def test_calculate_transport_co2e_car_is_not_scaled_by_passengers():
    # Car factor is per vehicle-km, so a 100 km trip costs the same total
    # emissions whether 1 or 4 people are in the car.
    solo = calculate_transport_co2e(100, "car", passengers=1)
    group = calculate_transport_co2e(100, "car", passengers=4)
    assert math.isclose(solo, 17.1)
    assert math.isclose(group, 17.1)


def test_calculate_transport_co2e_train_scales_with_passengers():
    # Train factor is per passenger-km, so it scales linearly with passengers.
    assert math.isclose(calculate_transport_co2e(200, "train", passengers=2), 200 * 0.035 * 2)


def test_calculate_transport_co2e_unknown_mode_raises():
    try:
        calculate_transport_co2e(10, "hyperloop")
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError for unknown transport mode")


def test_calculate_accommodation_co2e_known_value():
    assert math.isclose(calculate_accommodation_co2e(3, "hotel-night"), 60.0)


def test_calculate_activity_co2e_known_value():
    assert math.isclose(calculate_activity_co2e(2, "outdoor"), 0.4)
    assert math.isclose(calculate_activity_co2e(1, "indoor_venue"), 0.9)


def test_calculate_trip_co2e_sums_breakdown():
    result = calculate_trip_co2e(
        transport_legs=[
            {"distance_km": 100, "mode": "car", "passengers": 2},
            {"distance_km": 50, "mode": "train", "passengers": 2},
        ],
        nights=2,
        accommodation_category="hotel-night",
        activities=[
            {"hours": 3, "activity_type": "outdoor"},
            {"hours": 2, "activity_type": "indoor_venue"},
        ],
    )

    expected_transport = (100 * 0.171) + (50 * 0.035 * 2)
    expected_accommodation = 2 * 20.0
    expected_activity = (3 * 0.2) + (2 * 0.9)

    assert math.isclose(result["transport_co2e"], expected_transport)
    assert math.isclose(result["accommodation_co2e"], expected_accommodation)
    assert math.isclose(result["activity_co2e"], expected_activity)
    assert math.isclose(
        result["total_co2e"],
        expected_transport + expected_accommodation + expected_activity,
    )
