# GAR + Cloud Run CI/CD demo

This project creates the Artifact Registry (GAR) repository and Cloud Run
service with Terraform. GitHub Actions builds the Node.js container, pushes an
immutable commit-tagged image to GAR, and gives that exact image URI back to
Terraform for the Cloud Run deployment.

The application itself is a presentation-ready **CI/CD Enterprise Blueprint**.
Opening the Cloud Run URL displays an interactive walkthrough of the same
pipeline that deployed it: source change → test and security gates → Terraform
→ container build and scan → Artifact Registry → Cloud Run → live verification.

## Pipeline shown in GitHub Actions

The workflow is split into separately visible jobs so teams can see where a
change is stopped and what must pass before deployment:

1. Run application tests with native Node.js coverage.
2. Run Semgrep Community Edition SAST.
3. Scan dependencies and secrets with Trivy; review Terraform and Dockerfile
   findings.
4. Check Terraform formatting and validate the configuration.
5. Provision the Artifact Registry repository after all quality gates pass.
6. Build the commit-tagged container, scan it with Trivy, and push it to GAR.
7. Deploy the exact approved image to Cloud Run.
8. Test `/healthz` and the application page, then publish the URL.

The first four jobs run on pull requests without using Google Cloud
credentials. Provisioning and deployment run only on `main` or by manual
dispatch.

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
├── test/
│   └── app.test.js
├── app.js
├── server.js
├── requirements-security.txt
├── Dockerfile
├── package.json
└── package-lock.json
```

`k8s/manifest.yaml` is retained only as an optional Kubernetes equivalent. It
is not used by the Cloud Run workflow.

## One-time Google Cloud prerequisites

For this short-lived POC, the workflow uses a dedicated deployment service
account JSON key stored as a masked GitHub Actions secret. Use Workload Identity
Federation instead of a long-lived key when moving this workflow beyond the
POC.

The deployment service account needs:

- `roles/serviceusage.serviceUsageAdmin` on the project
- `roles/artifactregistry.admin` on the project
- `roles/run.admin` on the project
- `roles/iam.serviceAccountUser` on the Cloud Run runtime service account
- `roles/storage.objectAdmin` on the Terraform state bucket

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
| Secret | `GCP_SA_KEY` | Complete single-line service account JSON |
| Variable | `GCP_PROJECT_ID` | `my-project` |
| Variable | `TF_STATE_BUCKET` | `my-project-terraform-state-1234` |
| Variable | `GCP_REGION` | `us-central1` |
| Variable | `GAR_REPOSITORY` | `hello-world-images` |
| Variable | `CLOUD_RUN_SERVICE` | `hello-world` |
| Variable | `DEPLOY_ENVIRONMENT` | `demo` |
| Variable | `ALLOW_UNAUTHENTICATED` | `true` |

Only `GCP_SA_KEY`, `GCP_PROJECT_ID`, and `TF_STATE_BUCKET` are required.
The workflow supplies defaults for the other values.

Never commit the service account key file. Revoke the key when the POC ends.

If your organization blocks public Cloud Run services, set
`ALLOW_UNAUTHENTICATED` to `false` and replace the public health check with an
authenticated request.

## Run the demo

Open a pull request to show only the test, SAST, repository security, and
Terraform validation gates. Merge to `main`, or open **Actions → CI/CD - Test,
secure and deploy to Cloud Run → Run workflow**, to run the full delivery flow.
The successful run summary contains the image URI and Cloud Run URL.

The deploy job uses the GitHub environment named `demo`. You can add required
reviewers to that environment to demonstrate a human approval before Cloud Run
deployment. Leave it without reviewers for an uninterrupted POC.

## Security behavior

- Semgrep findings block the pipeline.
- High or critical dependency, repository-secret, and container findings block
  the pipeline.
- Terraform and Dockerfile misconfiguration findings are report-only for this
  POC because the demo intentionally allows unauthenticated Cloud Run access.
  For production, make the service private, set this scan to `exit-code: "1"`,
  and document any narrowly scoped exceptions.
- Third-party actions are pinned to immutable commit SHAs. The comments beside
  each SHA show the reviewed release version.

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
