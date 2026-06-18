from sqlalchemy import inspect, text


def aplicar_migracoes_minimas(engine):
    inspector = inspect(engine)

    if "projetos" not in inspector.get_table_names():
        return

    colunas_projetos = {
        coluna["name"]
        for coluna in inspector.get_columns("projetos")
    }

    novas_colunas = {
        "resumo": "TEXT DEFAULT 'Resumo pendente'",
        "caracteristicas": "TEXT DEFAULT 'Caracteristicas pendentes'",
        "objetivo": "TEXT",
        "status": "VARCHAR DEFAULT 'Ativo'",
    }

    with engine.begin() as connection:
        for nome_coluna, definicao in novas_colunas.items():
            if nome_coluna not in colunas_projetos:
                connection.execute(
                    text(
                        f"ALTER TABLE projetos ADD COLUMN {nome_coluna} {definicao}"
                    )
                )
