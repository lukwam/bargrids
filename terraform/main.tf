terraform {
  backend "gcs" {
    bucket = "lukwam-bargrids-tf"
  }
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "4.25.0"
    }
    google-beta = {
      source = "hashicorp/google-beta"
      version = "4.25.0"
    }
  }
}

provider "google" {
  project     = var.project_id
}

provider "google-beta" {
  project     = var.project_id
}

variable "app" {}
variable "branch" {}
variable "billing_account" {}
variable "domain_name" {}
variable "folder_id" {}
variable "project_id" {}
variable "project_name" {}
variable "region" {}
