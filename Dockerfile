FROM node:20
ENV REC_PATH=/recording
ENV META_PATH=/meta
COPY . /app
WORKDIR /app
RUN  npm install
WORKDIR /app/node_modules/whisper-node/lib/whisper.cpp/models
RUN ./download-ggml-model.sh small.en-tdrz
WORKDIR /app/node_modules/whisper-node/lib/whisper.cpp/
RUN make
WORKDIR /app
CMD ["nodejs", "sentiment2hep.mjs"]
