from django.test import SimpleTestCase
class ApiTests(SimpleTestCase):
    def test_forecast(self):
        r=self.client.get('/api/v1/water-demand/forecast/')
        self.assertEqual(r.status_code,200)
        self.assertEqual(len(r.json()['forecast']),7)
        self.assertEqual(r.json()['execution_mode'],'precomputed_artifact')
    def test_scenarios(self):
        r=self.client.get('/api/v1/water-balance/scenarios/')
        self.assertEqual(r.status_code,200)
        self.assertEqual(len(r.json()['scenarios']),4)
    def test_balance(self):
        r=self.client.get('/api/v1/water-balance/',{'scenario':'combined','period':'7d'})
        self.assertEqual(r.status_code,200)
        self.assertEqual(len(r.json()['daily']),7)
    def test_compare(self):
        self.assertEqual(len(self.client.get('/api/v1/water-balance/compare/').json()['daily']),7)
    def test_bad_scenario(self):
        self.assertEqual(self.client.get('/api/v1/water-balance/',{'scenario':'invalid'}).status_code,400)
    def test_bad_model(self):
        self.assertEqual(self.client.get('/api/v1/water-demand/forecast/',{'model':'mlp_backprop'}).status_code,400)
