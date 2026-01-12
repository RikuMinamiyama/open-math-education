FROM paperist/texlive-ja:latest

RUN tlmgr update --self && \
    tlmgr install \
    amsmath \
    amsfonts

WORKDIR /workdir

COPY src/sty /usr/local/texlive/2025/texmf-dist/

RUN mktexlsr && \
    updmap-sys --enable Map=ceo.map

ENTRYPOINT ["lualatex"]