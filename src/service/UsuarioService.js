import axios from 'axios';

export default class UsuarioService{
    url = "https://localhost:8080/api/v1";

    getAll(){
        return axios.get(this.url + "/clientes");
    }

}