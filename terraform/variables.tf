variable "iam_roles" {
  description = "サービスアカウントに付与する IAM ロールのリスト"
  type        = list(string)
  default     = [
    "roles/storage.objectUser",
  ]
}
variable cloud_functions {}