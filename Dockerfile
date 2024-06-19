FROM node:20
ENV REC_PATH /recording
COPY . .
RUN  npm install && npm install -g forever
CMD ["nodejs", "speech2hep.js"]
