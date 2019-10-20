import React from 'react';
import CodeFlower from '../CodeFlower'



class CodeFlowerComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = { codeflower : null};
    }

    componentDidMount() {
          var json ="";
          var myFlower = new CodeFlower("#visualization", 1000, 1000);
          this.setState({codeflower:myFlower}, () => {this.state.codeflower.update(json)});
    };



    render() {
        return (

             <div id="visualization"></div>

         );
    }}

    export default CodeFlowerComponent;



