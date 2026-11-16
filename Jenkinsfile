// Jenkins pipeline: ugyanazok a kapuk, mint a .github/workflows/ci.yml-ben.
// A telepítés (deploy) továbbra is a GitHub Actions deploy.yml dolga; ez csak ellenőriz.
//
// Feltételek a Jenkinsen: Docker Pipeline plugin és egy Docker-képes ügynök.
// A lépések konténerben futnak, így a Jenkinsre nem kell Node-ot vagy PHP-t telepíteni.

pipeline {
  agent none

  options {
    timestamps()
    disableConcurrentBuilds(abortPrevious: true)
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
    // Csak az eldobható CI-adatbázishoz; nem titok (ugyanaz, mint a GitHub CI-ban).
    APP_KEY = 'base64:IuoO2O2E2ePTfNKZ3XNlVF5ZfvMJM5zld0sDIFlKhQ8='
  }

  stages {
    stage('Ellenőrzések') {
      parallel {
        stage('Frontend') {
          agent { docker { image 'node:22' } }
          environment { HOME = "${WORKSPACE}" }
          steps {
            dir('frontend') {
              sh 'npm ci'
              sh 'npm run lint'
              sh 'npm run typecheck'
              sh 'npm run build'
            }
          }
        }

        stage('Backend') {
          agent { docker { image 'composer:2' } }
          environment {
            HOME = "${WORKSPACE}"
            COMPOSER_HOME = "${WORKSPACE}/.composer"
          }
          steps {
            dir('backend') {
              sh 'composer install --prefer-dist --no-interaction --no-progress'
              sh 'composer audit --no-interaction'
              sh 'composer lint'
              sh 'composer analyse'
              sh 'php artisan docs:endpoints --check'
            }
          }
        }

        stage('Teszt kód') {
          agent { docker { image 'node:22' } }
          environment { HOME = "${WORKSPACE}" }
          steps {
            dir('tests') {
              sh 'npm ci'
              sh 'npm run check'
            }
          }
        }
      }
    }

    // A frontend lefordított változatát szolgálja ki, az API-t kiváltja a mockApi: PHP nem kell.
    stage('E2E (mockolt API)') {
      agent { docker { image 'mcr.microsoft.com/playwright:v1.63.0-noble' } }
      environment { HOME = "${WORKSPACE}" }
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
        dir('tests') {
          sh 'npm ci'
          sh 'npx playwright test --project=e2e-mocked'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'tests/playwright-report/**, tests/test-results/**', allowEmptyArchive: true
        }
      }
    }
  }
}
