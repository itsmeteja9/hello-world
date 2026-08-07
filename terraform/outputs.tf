output "artifact_registry_repository" {
  description = "Artifact Registry repository resource name."
  value       = google_artifact_registry_repository.app.name
}

output "image_uri" {
  description = "Container image deployed to Cloud Run."
  value       = var.image
}

output "cloud_run_service" {
  description = "Cloud Run service resource name."
  value       = google_cloud_run_v2_service.app.name
}

output "cloud_run_url" {
  description = "Cloud Run service URL."
  value       = google_cloud_run_v2_service.app.uri
}
