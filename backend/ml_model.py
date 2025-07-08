import sys
import json
import numpy as np

class AirQualityPredictor:
    def __init__(self):
        self.model = None
        # Avoid unicode symbols that cause Windows cp1252 issues
        print("Warning: Untrained model in use.")

    def get_location_features(self, location):
        return {
            'latitude': 28.4595,
            'longitude': 77.0266,
            'elevation': 217,
            'population_density': 1000,
            'temperature': 25.0,
            'humidity': 60.0,
            'wind_speed': 5.0,
            'pressure': 1013.25
        }

    def fetch_satellite_data(self, location):
        return {
            'no2': 30.5,
            'so2': 12.3,
            'co': 1.1,
            'aerosol_index': 0.8,
            'formaldehyde': 0.15
        }

    def predict_current_aqi(self, location):
        loc = self.get_location_features(location)
        sat = self.fetch_satellite_data(location)

        aqi = np.random.randint(80, 180)
        pm25 = int(aqi * 0.6)
        pm10 = int(aqi * 0.8)

        return {
            'aqi': aqi,
            'pm25': pm25,
            'pm10': pm10,
            'no2': int(sat['no2']),
            'so2': int(sat['so2']),
            'co': round(sat['co'], 1)
        }

    def predict_forecast(self, location, days=3):
        current_aqi = self.predict_current_aqi(location)['aqi']
        forecast = []
        for hour in range(12, 24, 3):
            aqi = max(50, min(200, current_aqi + np.random.randint(-20, 20)))
            forecast.append({'time': f"{hour:02d}:00", 'aqi': aqi})
        for day in range(1, days + 1):
            aqi = max(50, min(200, current_aqi + np.random.randint(-30, 30)))
            forecast.append({'time': f"Day {day}", 'aqi': aqi})
        return forecast

    def predict_nearby(self, location, radius=50):
        cities = [
            {'name': 'Faridabad', 'distance': '12 km'},
            {'name': 'Noida', 'distance': '28 km'},
            {'name': 'Ghaziabad', 'distance': '35 km'},
            {'name': 'Palwal', 'distance': '42 km'}
        ]
        results = []
        for city in cities:
            aqi = self.predict_current_aqi(city['name'])['aqi']
            results.append({
                'name': city['name'],
                'aqi': aqi,
                'distance': city['distance']
            })
        return results

def main():
    if len(sys.argv) != 3:
        print("Usage: python ml_model.py <action> <params_json>", file=sys.stderr)
        sys.exit(1)

    action = sys.argv[1]
    try:
        params = json.loads(sys.argv[2])
        predictor = AirQualityPredictor()

        if action == 'predict_current':
            result = predictor.predict_current_aqi(params['location'])
        elif action == 'predict_forecast':
            result = predictor.predict_forecast(params['location'], params.get('days', 3))
        elif action == 'predict_nearby':
            result = predictor.predict_nearby(params['location'], params.get('radius', 50))
        else:
            raise ValueError(f"Unknown action: {action}")

        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
