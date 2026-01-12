FROM paperist/texlive-ja:latest

RUN tlmgr update --self && \
    tlmgr install \
    amsmath \
    amsfonts

WORKDIR /workdir

ENTRYPOINT ["lualatex"]