const express =  require('express');
const PORT =  3000
const app = express()


app.listen(PORT, () => {
    console.clear();
    console.log('Server is running on http://localhost:'+PORT)
});     