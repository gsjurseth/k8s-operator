#!/bin/bash


kubectl create clusterrolebinding %%CLUSTER_NAME%%-admin-binding --clusterrole=cluster-admin --user=youruser@email.com

# Apply all set of production resources defined in kustomization.yaml in `production` directory .
kubectl apply -k https://github.com/metacontroller/metacontroller/manifests/production
