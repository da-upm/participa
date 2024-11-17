FROM mingc/latex:latest as latex

FROM node:20-bookworm

COPY --from=latex /usr/local/texlive /usr/local/texlive

ENV PATH="$PATH:/usr/local/texlive/2021/bin/x86_64-linux"

RUN apt-get update -q && \
    apt-get install -y -qq --no-install-recommends \
        ca-certificates  \
        curl \
        ghostscript \
        git \
        gnuplot \
        imagemagick \
        make \
        jq \
        qpdf \
        python3-pygments \
        wget \
        vim-tiny && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]