// Criando um servidor básico com NodeJs + Express + Handlebars
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require('express-session');
const flash = require('connect-flash');


const app = express();
const port = process.env.PORT || 3000;

// Configuração do Motor de Templates (Usando handlebars - https://handlebarsjs.com/)
const hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: __dirname + "/views/layouts",
    helpers: {
        formatarPreco: preco => `R$ ${preco.toFixed(2).replace('.', ',')}`,
        eq: (a, b) => a === b
    }
});
app.engine('handlebars', hbs.engine);
app.set("view engine", 'handlebars');



// Middleware para converter as requisições
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir os arquivos estáticos (css e js)
app.use(express.static('assets'));

// Configuração da sessão
app.use(session({
    secret: 'sua_chave_secreta',  // Use uma chave secreta forte
    resave: false,
    saveUninitialized: true
}));

// Configuração do connect-flash
app.use(flash());

// Middleware para tornar as mensagens flash acessíveis em todas as views
app.use((req, res, next) => {
    res.locals.mensagemSucesso = req.flash('success');
    res.locals.mensagemErro = req.flash('error');
    next();
});


// Dados fictícios para a API

const produtos = [
    { id: 1, nome: "Produto 1", preco: 10 },
    { id: 2, nome: "Produto 2", preco: 20 },
    { id: 3, nome: "Produto 3", preco: 30 },
];

// Definindo a rota atual
app.use((req, res, next) => {
    res.locals.urlAtual = req.originalUrl;
    next();
});


// Rotas Principal para carregar o produto

app.get("/", (req, res) => { 
    res.render('pages/index', { title:"Minha página", produtos});
});

app.get("/novo-produto", (req, res) => {
    res.render('pages/novo-produto', { title:"Novo produto" });
});

// Rota para BUSCAR TODOS OS PRODUTOS
app.get("/produtos", (req, res) => {
    res.json(produtos);
});

// Rota para BUSCAR os dados de um único produto pelo ID
app.get("/produtos/:id", (req, res) => {
    const produto = produtos.find((p) => p.id === parseInt(req.params.id));

    if (!produto) {
        req.flash("error", "Produto não encontrado");
        return res.status(404).json({ message: "Produto não encontrado" });
    }

    res.json(produto);
});

// Rota para ADICIONAR um novo produto

app.post("/produtos", (req, res) => {
    const nome = req.body.nome;
    const preco = parseFloat(req.body.preco);

    const ultimoProduto = produtos[produtos.length - 1];
    const id = ultimoProduto.id + 1;

    if (
        !id ||
        !nome ||
        !preco ||
        typeof id !== "number" ||
        typeof preco !== "number"
    ) {
        req.flash("error", "Corpo da requisição inválido.");
        return res.redirect("/novo-produto");
    }   

    const novoProduto = { id, nome, preco };
    produtos.push(novoProduto);

    req.flash("success", "Produto salvo com sucesso!");
    return res.redirect("/");
});

// Rota para ALTERAR um produto pelo ID

app.put("/produtos/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const produtoIndex = produtos.findIndex(
        (p) => p.id === id
    );

    if (produtoIndex === -1) {
        return res.status(404).json({ message: "Produto não encontrado" });
    }

    const nome = req.body.nome;
    const preco = parseFloat(req.body.preco);

    console.log(typeof nome, typeof preco, typeof id, id, nome, preco)
    
    if (
        !id ||
        !nome ||
        !preco ||
        typeof id !== "number" ||
        typeof preco !== "number"
    ) {
        return res.status(400).json({ message: "Corpo da requisição inválido" });
    }

    const produtoAtualizado = { ...produtos[produtoIndex], id, nome, preco };
    produtos[produtoIndex] = produtoAtualizado;

    res.json(produtoAtualizado);
});

// Rota para REMOVER um produto pelo ID

app.delete("/produtos/:id", (req, res) => {
    const produtoIndex = produtos.findIndex(
        (p) => p.id === parseInt(req.params.id)
    );

    if (produtoIndex === -1) {
        return res.status(404).json({ message: "Produto não encontrado" });
    }

    produtos.splice(produtoIndex, 1);
    req.flash("success", "Produto removido com sucesso!");
    res.status(204).send();
});


// Middleware para tratar erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Algo de errado não está certo" });
});


// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
