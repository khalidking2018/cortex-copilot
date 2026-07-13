from fastapi import APIRouter, Header, HTTPException, status
from services.analytics_service import (
    calculate_energy,
    calculate_power_factor,
    calculate_voltage,
    calculate_current,
    calculate_frequency,
    calculate_max_demand,
    detect_anomalies,
    get_powerfactor_chart,
    get_voltage_chart,
    get_current_chart,
    get_energy_chart,
    get_power_chart,
    get_demand_chart,
    calculate_billing,
    calculate_power
)
from utils.auth import verify_token

router = APIRouter()

def get_tenant_or_401(authorization: str) -> str:
    tenant_id = verify_token(authorization)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized or invalid token"
        )
    return tenant_id


@router.get("/energy")
def energy(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_energy(tenant, range)


@router.get("/powerfactor")
def power_factor(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_power_factor(tenant, range)


@router.get("/voltage")
def voltage(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_voltage(tenant, range)


@router.get("/current")
def current(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_current(tenant, range)


@router.get("/frequency")
def frequency(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_frequency(tenant, range)


@router.get("/demand")
def demand(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_max_demand(tenant, range)


@router.get("/anomalies")
def anomalies(authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return detect_anomalies(tenant)


@router.get("/billing")
def billing(month: str = None, authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_billing(tenant, month)


@router.get("/power")
def power(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return calculate_power(tenant, range)


@router.get("/gateway/health")
def gateway_health(authorization: str = Header(None)):
    # Verify authentication for gateway diagnostics as well
    get_tenant_or_401(authorization)
    return {
        "temperature": 51,
        "ram_usage": 12,
        "cpu_usage": 5
    }


@router.get("/chart/powerfactor")
def chart_powerfactor(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_powerfactor_chart(tenant, range)


@router.get("/chart/voltage")
def chart_voltage(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_voltage_chart(tenant, range)


@router.get("/chart/current")
def chart_current(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_current_chart(tenant, range)


@router.get("/chart/energy")
def chart_energy(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_energy_chart(tenant, range)


@router.get("/chart/power")
def chart_power(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_power_chart(tenant, range)


@router.get("/chart/demand")
def chart_demand(range: str = "today", authorization: str = Header(None)):
    tenant = get_tenant_or_401(authorization)
    return get_demand_chart(tenant, range)