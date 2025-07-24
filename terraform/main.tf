terraform {
  backend "gcs" {
    bucket  = "terrform-bucket-smarthome-428311"
    prefix  = "state/fbrains-tools"
  }
}
provider "google" {
  project = "smarthome-428311"  # 使用するGCPプロジェクトID
  region  = "asia-northeast1"      # GCPリージョン（例：us-central1）
}
locals {
  project = "smarthome-428311"  # 使用するGCPプロジェクトID
  region  = "asia-northeast1" 
}


resource "google_service_account" "account" {
  account_id   = "fbrains-tools-invoker"
  display_name = "fbrains-tools-invoker"
}

resource "google_project_iam_member" "project" {
  for_each = toset(var.iam_roles)
  project = local.project
  role    = each.value
  member  = "serviceAccount:${google_service_account.account.email}"
}

resource "google_project_iam_member" "token_creator" {
  project = local.project
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.account.email}"
}

data "google_storage_bucket" "bucket" {
  name                        = "${local.project}-gcf-source"  # Every bucket name must be globally unique
}

data "archive_file" "gcf-function" {
  for_each = var.cloud_functions
  type        = "zip"
  output_path = "./${each.key}/function-source.zip"
  source_dir    = "..${each.value.source_dir}"
  excludes    = ["env/**", "**/__pycache__/**","node_modules/**",] 
}

resource "google_storage_bucket_object" "object" {
  for_each = var.cloud_functions
  name   = "${each.key}/function_source_${substr(filemd5("./${each.key}/function-source.zip"), 0, 8)}.zip"
  bucket = data.google_storage_bucket.bucket.name
  source = "./${each.key}/function-source.zip"
}

resource "google_cloudfunctions2_function" "cloud_functions" {
  for_each = var.cloud_functions
  name = each.key
  location = local.region
  description = each.value.description

  build_config {
    runtime = each.value.runtime
    entry_point = each.value.entry_point

    source {
      storage_source {
        bucket = data.google_storage_bucket.bucket.name
        object = google_storage_bucket_object.object[each.key].name
      }
    }
  }

  service_config {
    max_instance_count  = 10
    min_instance_count = 0
    available_memory    = each.value.memory
    timeout_seconds     = each.value.timeout_seconds
    service_account_email = google_service_account.account.email

  }
}



resource "google_cloud_run_service_iam_member" "cloud_run_invoker" {
  for_each = var.cloud_functions
  project  = google_cloudfunctions2_function.cloud_functions[each.key].project
  location = google_cloudfunctions2_function.cloud_functions[each.key].location
  service  = google_cloudfunctions2_function.cloud_functions[each.key].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
