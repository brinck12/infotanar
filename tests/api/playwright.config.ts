import { defineConfig } from '@playwright/test'

/**
 * Ezek a tesztek egy valodi (helyi) backend ellen futnak, sqlite fixture
 * adatbazissal es egy hamis Judge0-lal (lasd ../shared/judge0-mock.js).
 * Nincs bongeszo: csak nyers HTTP hivasok az APIRequestContext-tel.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    // Vegen kotelezo a per jel: a relativ utvonalak (pl. request.get('tasks'))
    // elejen NINCS per, kulonben a WHATWG URL feloldas levagna az /api/v1-et.
    baseURL: 'http://127.0.0.1:8000/api/v1/',
    // Accept fejlec nelkul a Laravel validacios hiba 302-t ad JSON helyett.
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  webServer: [
    {
      command: 'node ../shared/judge0-mock.js',
      url: 'http://127.0.0.1:2358/about',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // "php artisan serve" egy kulon gyerekfolyamatkent inditja a valodi
      // PHP szervert (Symfony Process-szel) - Windows alatt ezt a Playwright
      // nem tudja megbizhatoan leallitani leallaskor, es egy elszabadult
      // szerver a kovetkezo futtatasnal regi/hianyzo adatbazissal valaszol.
      // Ezert kozvetlenul a beepitett PHP szervert inditjuk, ugyanugy,
      // ahogy a "serve" parancs is tenne (lasd ServeCommand::serverCommand).
      command:
        'php artisan test:prepare-api-fixtures && cd public && php -S 127.0.0.1:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php',
      cwd: '../../backend',
      url: 'http://127.0.0.1:8000/api/v1/health',
      // Sosem hasznaljunk ujra korabbi peldanyt: a fixture-oknek minden
      // futtataskor frissen kell letrejonniuk, kulonben csendben elavult
      // allapotot tesztelnenk.
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        APP_ENV: 'testing',
        APP_KEY: 'base64:IuoO2O2E2ePTfNKZ3XNlVF5ZfvMJM5zld0sDIFlKhQ8=',
        APP_DEBUG: 'true',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: 'database/testing.sqlite',
        SESSION_DRIVER: 'array',
        // Nem "array": a beepitett PHP szerver kerelmenkent uj folyamatban
        // fut, egy in-memory cache nem elne tul egy kerelmet, es a
        // rate-limit teszt sosem latna a szamlalot novekedni.
        CACHE_STORE: 'file',
        QUEUE_CONNECTION: 'sync',
        BROADCAST_CONNECTION: 'log',
        MAIL_MAILER: 'array',
        JUDGE0_URL: 'http://127.0.0.1:2358',
      },
    },
  ],
})
