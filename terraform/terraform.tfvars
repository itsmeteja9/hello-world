project_id    = "devops-poc-demo"
region        = "us-central1"
repository_id = "hello-world-images"
service_name  = "hello-world"

environment           = "demo"
allow_unauthenticated = true

labels = {
  cost_center = "demo"
  owner       = "platform-team"
}
