from django.test import SimpleTestCase
from forecasting.services import SCENARIOS, simulate, comparison, load_forecast
from django.conf import settings

class BalanceTests(SimpleTestCase):
    def setUp(self):
        self.forecast=load_forecast(settings.WATERWISE_ARTIFACT_DIR)['forecast']
    def test_four_scenarios(self):
        self.assertEqual(set(SCENARIOS), {'normal','peak','reduced','combined'})
        for s in SCENARIOS:
            result=simulate(self.forecast,s)
            self.assertEqual(len(result['daily']),7)
            self.assertTrue(all(0<=r['storage_end_m3']<=250000 for r in result['daily']))
    def test_mass_balance(self):
        for s in SCENARIOS:
            storage=175000
            for r in simulate(self.forecast,s)['daily']:
                self.assertAlmostEqual(storage+r['production_m3'],r['delivered_m3']+r['storage_end_m3'],delta=.03)
                self.assertAlmostEqual(r['required_m3'],r['delivered_m3']+r['unmet_m3'],delta=.03)
                storage=r['storage_end_m3']
    def test_comparison(self):
        self.assertEqual(len(comparison(self.forecast)['daily']),7)
    def test_bad_scenario(self):
        with self.assertRaises(ValueError):simulate(self.forecast,'not-real')
