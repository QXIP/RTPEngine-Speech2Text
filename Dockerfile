FROM node:20
ENV REC_PATH /recording
ENV META_PATH /meta
COPY . /app
WORKDIR /app
RUN  npm install
WORKDIR /app/node_modules/whisper-node/lib/whisper.cpp/
RUN make
WORKDIR /app
RUN npx whisper-node download
CMD ["nodejs", "speech2hep.js"]
