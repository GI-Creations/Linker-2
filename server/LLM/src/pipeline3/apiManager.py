import os
import time
from pprint import pprint
from dotenv import load_dotenv

load_dotenv()

class ApiManager:
    def __init__(self):
        self.api_keys = {}
        self.api_usage = {}

        # Load API keys from environment variables
        for key, value in os.environ.items():
            if "_" in key and key.endswith(tuple("1234567890")):
                parts = key.split('_')
                try:
                    if len(parts) >= 5:
                        # Skip if the parts can't be converted to integers
                        try:
                            limit = int(parts[-3])
                            period = int(parts[-2])
                        except ValueError:
                            continue
                            
                        prefix = '_'.join(parts[:-3])
                        
                        if prefix not in self.api_keys:
                            self.api_keys[prefix] = []
                            self.api_usage[prefix] = {}
                        self.api_keys[prefix].append((value, limit, period))
                        self.api_usage[prefix][value] = {'count': 0, 'expiry': None, 'limit': limit, 'period': period}
                except Exception as e:
                    print(f"Warning: Could not parse API key {key}: {e}")
                    continue

    def _reset_key(self, service, key):
        self.api_usage[service][key] = {'count': 0, 'expiry': None, 'limit': self.api_usage[service][key]['limit'], 'period': self.api_usage[service][key]['period']}

    def _is_key_expired(self, service, key):
        expiry = self.api_usage[service][key]['expiry']
        return expiry is not None and time.time() > expiry

    def get_key(self, service):
        if service not in self.api_keys:
            raise Exception(f"No API keys available for service: {service}")

        for key, limit, period in self.api_keys[service]:
            usage = self.api_usage[service][key]
            if self._is_key_expired(service, key):
                self._reset_key(service, key)

            if usage['count'] < limit:
                if usage['expiry'] is None:
                    usage['expiry'] = time.time() + (period * 60)  # Set expiry to the specified period from now

                usage['count'] += 1
                print(f"Using {service} API key : {key}")
                return key

        raise Exception(f"No valid API keys available for service: {service}")

    def reset(self):
        for service in self.api_usage:
            for key in self.api_usage[service]:
                self._reset_key(service, key)

    def get_usage_info(self):
        return self.api_usage

if __name__ == "__main__":
    api_manager = ApiManager()
    try:
        service_name = 'COHERE_API_KEY'
        key = api_manager.get_key(service_name)
        pprint(f"Using API key for {service_name}: {key}")
        pprint(api_manager.get_usage_info())
    except Exception as e:
        print(e)
