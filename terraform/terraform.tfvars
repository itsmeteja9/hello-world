project_id    = "devops-poc-demo"
region        = "us-central1"
repository_id = "hello-world-images"
service_name  = "hello-world"

image = "us-central1-docker.pkg.dev/devops-poc-demo/hello-world-images/hello-world:commit-sha"

environment           = "demo"
allow_unauthenticated = true

labels = {
  cost_center = "demo"
  owner       = "platform-team"
}
