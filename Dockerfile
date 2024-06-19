FROM node:20
ENV REC_PATH /recording
COPY . /app
WORKDIR /app
RUN  npm install
CMD ["nodejs", "speech2hep.js"]
