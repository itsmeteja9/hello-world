terraform {
  # The workflow supplies bucket and prefix through -backend-config.
  # The bucket must exist before the first pipeline run.
  backend "gcs" {}
}
