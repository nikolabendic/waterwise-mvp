from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from hydrology.views import error_response
from .services import SCENARIOS, LIMITATIONS, load_forecast, simulate, comparison


def source():
    return load_forecast(settings.WATERWISE_ARTIFACT_DIR)


def unavailable(exc):
    return error_response("artifact_unavailable", str(exc), 503)


@api_view(['GET'])
def health(request):
    try:
        payload = source()
        return Response({'status': 'ok', 'forecast_ready': True,
                         'model_status': payload.get('model_status', 'experimental')})
    except (FileNotFoundError, ValueError, KeyError) as exc:
        return unavailable(exc)


@api_view(['GET'])
def forecast(request):
    try:
        payload = source()
        # Serves the precomputed Part-2 artifact, not live model inference.
        requested = request.query_params.get('model', 'selected')
        if requested not in ('selected', payload.get('model_type')):
            return error_response(
                "model_not_available",
                "Only the selected-model artifact is available.",
                400,
                {"allowed": ["selected", payload.get('model_type')]},
            )
        return Response({**payload, 'execution_mode': 'precomputed_artifact',
                         'provenance': {'utility': 'synthetic',
                                        'weather': payload.get('future_weather_type', 'unknown')}})
    except (FileNotFoundError, ValueError, KeyError) as exc:
        return unavailable(exc)


@api_view(['GET'])
def scenarios(request):
    return Response({
        'scenarios': [{'id': k, **v} for k, v in SCENARIOS.items()],
        'parameters': {'initial_storage_m3': 175000, 'max_storage_m3': 250000,
                       'base_capacity_m3_per_day': 120000, 'refill_factor': 0.15},
        'data_type': 'synthetic',
        'limitations': LIMITATIONS,
    })


@api_view(['GET'])
def water_balance(request):
    scenario = request.query_params.get('scenario', 'normal')
    period = request.query_params.get('period', '7d')
    if scenario not in SCENARIOS:
        return error_response("invalid_scenario", "Unknown scenario.", 400,
                              {"allowed": list(SCENARIOS)})
    if period != '7d':
        return error_response("invalid_period", "Only 7d is supported.", 400,
                              {"allowed": ["7d"]})
    try:
        data = source()
        return Response({**simulate(data['forecast'], scenario),
                         'model_type': data['model_type'],
                         'model_status': data['model_status'],
                         'trained_on': data['trained_on'],
                         'provenance': {'utility': 'synthetic',
                                        'weather': data.get('future_weather_type', 'unknown')}})
    except (FileNotFoundError, ValueError, KeyError) as exc:
        return unavailable(exc)


@api_view(['GET'])
def compare(request):
    try:
        data = source()
        return Response({**comparison(data['forecast']), 'model_type': data['model_type']})
    except (FileNotFoundError, ValueError, KeyError) as exc:
        return unavailable(exc)