FROM node:latest
RUN mkdir -p /apigee-controller && chown -R node:node /apigee-controller
WORKDIR /apigee-controller
COPY --chown=node:node package*.json ./
COPY --chown=node:node apigee-controller.js ./
USER node
RUN npm install
EXPOSE 8080
CMD [ "node", "/apigee-controller/apigee-controller.js" ]
