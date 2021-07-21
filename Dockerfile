FROM kry9ton/wabot-image:latest

RUN git clone https://github.com/normanlol/lilypad /home/lily
WORKDIR /home/lily

RUN npm i

CMD ["npm", "start"]
