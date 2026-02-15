### 1. integração com formulário:
Quero que me ajude a pensar e a planejar Não quero que e implementes nada mas quero que simplesmente me des ideias e gostaria de escolher a melhor ideia.
Eu tenho um formulário feito em Google forms Nesse formulário eu tenho várias perguntas que faço a meus clientes do Airbnb Onde perguntou os documentos, o motivo, E as data de check-in de check-out que eles vão ficar, Como poderia usar esse formulário E integrar a meu sistema Para que quando eu procurar por uma pessoa possa saber O motivo pelo qual ele se hospedou e quantas pessoas vieram para a minha casa Porque esses dados o Airbnb não me proporciona, não me dá esses valores. Aí através do formulário eu poderia ter valores extras assim quando eu procurar por uma pessoa ou algum codigo de hospedagem ou data eu não sei como poderia solucionar isso. Eu gostaria integrar mais informação relevante a meu sistema.

### 2. transformar em aplicativo:
Quero que me ajudes a planejar e pensar como poderia Modificar meu sistema para que ele se transforme e num aplicativo. Eu não quero Programar em Android Studio mas eu quero simplesmente tudo o que já está implementado agora em Angular possa ser transformado por algum tipo de modificação e assim poder ver visualizar como se fosse um aplicativo. Quero perguntar também se meu projeto vai precisar mudar alguma coisa, se eu quiser implementar um Progressive Web App (PWA) eu deveria criar outro projeto especifico para isso?, ou meu projeto atual é suficiente.

### 3. View mostrando entradas:
a tabela de "airbnb_logs" salva um relatorio do da lista de pagamentos que o airbnb faz para o anfitrião, a tabela de "v_unified_earnings" faz uma união com pagamentos feitos por fora da plataforma do airbnb e da tabela "airbnb_logs"

eu quero que modifiques esta view: "v_unified_earnings"  e que ela faça as seguintes modificações:

- quero que tragas todos os pagamentos feitos para o anfitriao.
- para trazer todos pagamentos, leva em consideração o seguinte:
- pagamentos para o anfitrião: quando é Tipo: Reserva 

### 4. tabela airbnb_logs:

A tabela de "airbnb_logs" salva o relatorio do anfitrião principal, ela é uma lista de pagamentos que o airbnb faz para o anfitrião.
quero que refatores esta tabela, da seguinte forma:

quero que eliminar todos estes dados que estão errados e refatorar a tabela da seguinte forma:

Considerando o seguinte: quando uma fila do relatorio em csv tiver por tipo: "Payout" ele sempre va a mostrar um valor na coluna "Pago", todos essses valores são pagamentos recebidos pelo anfitrião. 

Descrição do problema: o problema é que os pagamentos estão numa fila diferente, gostaria que possas eliminar essa fila que tem o tipo: "Payout" e faças um merge com a fila proxima que esta ligado ao pagamento. Geralmente os pagamentos são feito em dias separados, mas tem haz vezes varios pagamentos são feito no mesmo dia.

como solucionar:

quando forem qualquer tipo menos "Recebimento do coanfitrião" exemplo:
Reserva,  Créditos Diversos, Pagamento da Resolução.

- agrupar por "Data", mergear todas as colunas de "Payout" com a fila proxima do tipo menos o tipo "Recebimento do coanfitrião"
se os campo estiver preenchido, colocar os dois valores na mesma fila separando com "/" ex: "Payout/Reserva", "Payout/Créditos Diversos", "Payout/Pagamento da Resolução"...

- quando a fila for do tipo "Recebimento do coanfitrião" ele não deve fazer nada, exepto colocar o valor na coluna "Pago" esse valor deve ser o valor da coluna "Valor" mas com o sinal positivo, atualmenete ele sempre vem negativo.

ter cuidado ao fazer o merge ja que pode ter varios pagamentos "Payout" no mesmo dia, mas cada pagamento está ligado a uma fila diferente, então é necessário fazer o merge de forma que cada pagamento esteja ligado a sua fila correspondente. geralmente o pagamento está ligado a fila seguinte.

consideração final: quero que continue a funcionalidade de syncronizar relatorios, ao subir novo relatorio:

que meu sistema possa ser o suficiente inteligente de extrair novos pagamento es não subtituir os valores ja existentes.


### 5. view "v_unified_earnings"

Quero que traga todos os pagamentos feitos na tabela "airbnb_logs" e na tabela "
