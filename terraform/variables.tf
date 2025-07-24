variable "iam_roles" {
  description = "サービスアカウントに付与する IAM ロールのリスト"
  type        = list(string)
  default     = [
    "roles/storage.objectUser",
    "roles/iam.serviceAccountTokenCreator"
  ]
}
variable cloud_functions {}