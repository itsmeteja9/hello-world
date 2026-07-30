# GAR + Cloud Run CI/CD demo

This project creates the Artifact Registry (GAR) repository and Cloud Run
service with Terraform. GitHub Actions builds the Node.js container, pushes an
immutable commit-tagged image to GAR, and gives that exact image URI back to
Terraform for the Cloud Run deployment.

The application itself is a presentation-ready **CI/CD Enterprise Blueprint**.
Opening the Cloud Run URL displays an interactive walkthrough of the same
pipeline that deployed it: GitHub commit → Terraform → Docker → Artifact
Registry → Cloud Run.

## Deployment flow

1. Authenticate from GitHub to Google Cloud with Workload Identity Federation.
2. Initialize Terraform with a persistent GCS backend.
3. Enable the Artifact Registry and Cloud Run APIs.
4. Create the GAR repository with Terraform.
5. Build the application image and push it to GAR.
6. Create or update Cloud Run with Terraform.
7. Call `/healthz` and publish the service URL in the workflow summary.

The two Terraform applies are intentional. On the first run, GAR must exist
before Docker can push the image, and the image must exist before Cloud Run can
deploy it.

## Repository layout

```text
.
├── .github/workflows/deploy.yml
├── terraform/
│   ├── backend.tf
│   ├── main.tf
│   ├── outputs.tf
│   ├── variables.tf
│   ├── versions.tf
│   └── terraform.tfvars.example
├── k8s/manifest.yaml
├── public/
│   ├── index.html
│   ├── styles.css
│   └── client.js
├── app.js
├── Dockerfile
├── package.json
└── package-lock.json
```

`k8s/manifest.yaml` is retained only as an optional Kubernetes equivalent. It
is not used by the Cloud Run workflow.

## One-time Google Cloud prerequisites

Use an existing Workload Identity Federation provider and deployment service
account, or ask a Google Cloud administrator to create them for this GitHub
repository.

The deployment service account needs:

- `roles/serviceusage.serviceUsageAdmin` on the project
- `roles/artifactregistry.admin` on the project
- `roles/run.admin` on the project
- `roles/iam.serviceAccountUser` on the Cloud Run runtime service account
- `roles/storage.objectAdmin` on the Terraform state bucket

The GitHub repository principal also needs
`roles/iam.workloadIdentityUser` on the deployment service account.

Create the Terraform state bucket once before the first workflow run. Bucket
names are globally unique:

```bash
gcloud storage buckets create gs://YOUR_UNIQUE_TF_STATE_BUCKET \
  --project=YOUR_GCP_PROJECT_ID \
  --location=us-central1 \
  --uniform-bucket-level-access

gcloud storage buckets update gs://YOUR_UNIQUE_TF_STATE_BUCKET --versioning
```

The GCS backend requires this bucket to exist before `terraform init`.

## GitHub repository configuration

In **Settings → Secrets and variables → Actions**, add:

| Type | Name | Example |
| --- | --- | --- |
| Secret | `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/my-repo` |
| Secret | `GCP_SERVICE_ACCOUNT` | `github-deployer@my-project.iam.gserviceaccount.com` |
| Variable | `GCP_PROJECT_ID` | `my-project` |
| Variable | `TF_STATE_BUCKET` | `my-project-terraform-state-1234` |
| Variable | `GCP_REGION` | `us-central1` |
| Variable | `GAR_REPOSITORY` | `hello-world-images` |
| Variable | `CLOUD_RUN_SERVICE` | `hello-world` |
| Variable | `DEPLOY_ENVIRONMENT` | `demo` |
| Variable | `ALLOW_UNAUTHENTICATED` | `true` |

Only `GCP_PROJECT_ID`, `TF_STATE_BUCKET`, and the two secrets are required.
The workflow supplies defaults for the other values.

If your organization blocks public Cloud Run services, set
`ALLOW_UNAUTHENTICATED` to `false` and replace the public health check with an
authenticated request.

## Run the demo

Push to `main`, or open **Actions → Provision GAR and deploy Cloud Run → Run
workflow**. The successful run summary contains the image URI and Cloud Run URL.

Open that Cloud Run URL to present the interactive pipeline page. Select a stage
to explain it, switch between guided and technical views, or choose **Run
pipeline demo** to animate the complete delivery path. The service card displays
the real Cloud Run URL currently open in the browser.

## Application change made for Cloud Run

Cloud Run injects a `PORT` environment variable, so `app.js` listens on
`process.env.PORT` with a default of `8080`. Express serves the static
presentation assets in `public/`, while `/healthz` remains available for the
deployment smoke test. The Dockerfile and optional Kubernetes manifest use the
same port.
