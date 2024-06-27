FROM node:20
ENV REC_PATH /recording
ENV META_PATH /meta
COPY . /app
WORKDIR /app
RUN  npm install
RUN npx whisper-node download
CMD ["nodejs", "speech2hep.js"]
