
terraform {
  backend "gcs" {
    bucket = "compositecalendar-tf"
    prefix = "worker"
  }
}

data "terraform_remote_state" "infrastructure" {
  backend = "gcs"
  config = {
    bucket = "compositecalendar-tf"
    prefix = "infrastructure"
  }
}

provider "google" {
  project = "compositecalendar"
}

provider "kubernetes" {
  load_config_file       = "false"
  host                   = data.terraform_remote_state.infrastructure.outputs.kube_host
  client_certificate     = base64decode(data.terraform_remote_state.infrastructure.outputs.kube_client_certificate)
  client_key             = base64decode(data.terraform_remote_state.infrastructure.outputs.kube_client_key)
  cluster_ca_certificate = base64decode(data.terraform_remote_state.infrastructure.outputs.kube_ca_certificate)
}

locals {
  version   = jsondecode(file("./package.json")).version
  appname   = trimprefix(jsondecode(file("./package.json")).name, "@hattmo/")
  imagename = trimprefix(jsondecode(file("./package.json")).name, "@")
}


resource "kubernetes_deployment" "app" {
  metadata {
    name = "${local.appname}-deployment"
    labels = {
      app = local.appname
    }
  }
  spec {
    replicas = 0
    selector {
      match_labels = {
        app = local.appname
      }
    }
    template {
      metadata {
        labels = {
          app = local.appname
        }
      }
      spec {
        container {
          name  = local.appname
          image = local.imagename
          env {
            CLIENT_ID = data.terraform_remote_state.infrastructure.outputs.oauth_client_id
            CLIENT_SECRET = data.terraform_remote_state.infrastructure.outputs.oauth_client_secret
            DB_CONNECTION = data.terraform_remote_state.infrastructure.outputs.db_connection
            DB_USERNAME = data.terraform_remote_state.infrastructure.outputs.db_username
            DB_PASSWORD = data.terraform_remote_state.infrastructure.outputs.db_password
          }
        }
      }
    }
  }
}