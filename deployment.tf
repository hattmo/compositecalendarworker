
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
    replicas = 1
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
          image = join(":",[local.imagename, local.version])
          env {
            name  = "DB_CONNECTION"
            value = data.terraform_remote_state.infrastructure.outputs.db_connection
          }
          env {
            name  = "DB_USERNAME"
            value = data.terraform_remote_state.infrastructure.outputs.db_username
          }
          env {
            name  = "DB_PASSWORD"
            value = data.terraform_remote_state.infrastructure.outputs.db_password
          }
          env {
            name  = "OAUTH_CLIENT_ID"
            value = data.terraform_remote_state.infrastructure.outputs.oauth_client_id
          }
          env {
            name  = "OAUTH_CLIENT_SECRET"
            value = data.terraform_remote_state.infrastructure.outputs.oauth_client_secret
          }

        }
      }
    }
  }
}