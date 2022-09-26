#!/bin/bash


kubectl create clusterrolebinding gsjurseth-cluster-admin-binding --clusterrole=cluster-admin --user=gsjurseth@google.com

# Apply all set of production resources defined in kustomization.yaml in `production` directory .
kubectl apply -k https://github.com/metacontroller/metacontroller/manifests/production
