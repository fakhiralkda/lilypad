FROM kry9ton/wabot-image:latest

RUN git clone https://github.com/fakhiralkda/lilypad /home/lily
WORKDIR /home/lily

RUN npm i

CMD ["npm", "start"]
