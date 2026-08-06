pipeline {
    agent any

    tools {
        nodejs 'NodeJS26'
        terraform 'TerraformLatest'
    }

    environment {
        PROJECT_ID      = "devops-poc-demo"
        REGION          = "us-central1"
        REPO            = "hello-repo"
        IMAGE_NAME      = "devops-poc"
        IMAGE_TAG       = "1"
        FULL_IMAGE_PATH = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${IMAGE_TAG}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Semgrep Scan') {
            steps {
                script {
                    // Check if semgrep exists on Windows PATH
                    def semgrepExists = bat(
                        script: 'where semgrep',
                        returnStatus: true
                    ) == 0

                    if (semgrepExists) {
                        echo "Semgrep found — running scan"
                        bat 'semgrep scan --config auto .'
                    } else {
                        echo "Semgrep not installed — skipping Semgrep scan"
                    }
                }
            }
        }

        stage('Trivy FS Scan') {
            steps {
                script {
                    def trivyExists = bat(
                        script: 'where trivy',
                        returnStatus: true
                    ) == 0

                    if (trivyExists) {
                        echo "Trivy found — running filesystem scan"
                        bat 'trivy fs .'
                    } else {
                        echo "Trivy not installed — skipping Trivy scan"
                    }
                }
            }
        }

        stage('SonarCloud Analysis') {
            environment {
                SONAR_TOKEN = credentials('SONAR_TOKEN')
            }
            steps {
                withSonarQubeEnv('SonarCloud') {
                    bat """
                        sonar-scanner ^
                          -Dsonar.projectKey=harnesspoc_devops-poc ^
                          -Dsonar.organization=harnesspoc ^
                          -Dsonar.sources=. ^
                          -Dsonar.host.url=https://sonarcloud.io ^
                          -Dsonar.login=%SONAR_TOKEN%
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Authenticate to GCP') {
            steps {
                withCredentials([file(credentialsId: 'gcp-sa-key', variable: 'GOOGLE_APPLICATION_CREDENTIALS')]) {
                    bat """
                        gcloud auth activate-service-account --key-file=%GOOGLE_APPLICATION_CREDENTIALS%
                        gcloud config set project ${PROJECT_ID}
                    """
                }
            }
        }

        stage('Build Image using Cloud Build') {
            steps {
                bat """
                    gcloud builds submit --tag ${FULL_IMAGE_PATH} --project=${PROJECT_ID}
                """
            }
        }

        stage('Terraform Init/Plan/Apply') {
            steps {
                bat """
                   cd terraform
                   terraform init
                   terraform plan
                   terraform apply -auto-approve
                """
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                bat """
                    gcloud run deploy ${IMAGE_NAME} ^
                        --image ${FULL_IMAGE_PATH} ^
                        --region ${REGION} ^
                        --platform managed ^
                        --allow-unauthenticated ^
                        --project ${PROJECT_ID}
                """
            }
        }

        stage('Health Check') {
            steps {
                bat """
                    curl -I https://${IMAGE_NAME}-${REGION}.run.app
                """
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}
