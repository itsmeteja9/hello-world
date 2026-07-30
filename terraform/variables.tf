variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Region for Artifact Registry and Cloud Run."
  type        = string
  default     = "us-central1"
}

variable "repository_id" {
  description = "Artifact Registry Docker repository name."
  type        = string
  default     = "hello-world-images"
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "hello-world"
}

variable "image" {
  description = "Full Artifact Registry image URI, including tag or digest."
  type        = string
}

variable "environment" {
  description = "Environment label applied to managed resources."
  type        = string
  default     = "demo"
}

variable "allow_unauthenticated" {
  description = "Whether the Cloud Run service is publicly invokable."
  type        = bool
  default     = true
}

variable "runtime_service_account_email" {
  description = "Optional Cloud Run runtime service account. Empty uses the project default."
  type        = string
  default     = ""
}

variable "labels" {
  description = "Additional labels for GAR and Cloud Run."
  type        = map(string)
  default     = {}
}
