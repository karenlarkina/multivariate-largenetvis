class Dialog {
    constructor(props = {}) {

        
        this.title = props.title || '';
        this.content = props.content || '';
        this.hasClose = props.hasClose || false;
        this.hasButtonClose = props.hasButtonClose || false;
        this.hasButtonOk = props.hasButtonOk || false;
        this.hasHeader = props.hasHeader || false;
        this.hasFooter = props.hasFooter || false;
        this.dataBackDrop = props.dataBackDrop || false;
        this.buttonOkOnClick = props.buttonOkOnClick || function(){};
        this.buttonCloseOnClick = props.buttonCloseOnClick || function(){};
        this.closeOnClick = props.closeOnClick || function(){};
        this.okText = props.okText ||'Ok';
        this.closeText = props.closeText ||'Close';

        
        this.createHtml();
    }
    show(){
        this.element.modal('show');
    }
    hide(){  
        this.element.modal('hide');
    }
    destroy(){
        //this.element.modal('dispose');
        this.element.remove();
    }
    createHtml() {

        let d1 = document.createElement('div');
        $(d1)
        .attr('class', 'modal')
        .attr('tabindex', '-1')
        .attr('role', 'dialog')
        .attr('aria-labelledby', 'staticBackdropLabel')
        .attr('aria-hidden', 'true');

        if(this.dataBackDrop){
            $(d1).attr('data-backdrop', 'static')
        }
        

        let d2 = document.createElement('div');
        $(d2)
        .attr('class', 'modal-dialog modal-dialog-centered')
        .attr('role', 'document');

        let d3 = document.createElement('div');
        $(d3)
        .attr('class', 'modal-content');

        let d4 = document.createElement('div');
        $(d4)
        .attr('class', 'modal-header');

        let h1 = document.createElement('h5');
        $(h1)
        .attr('class', 'modal-title')
        .html(this.title);

        let b1 = document.createElement('button');
        $(b1)
        .attr('type', 'button')
        .attr('class', 'close')
        .attr('data-dismiss', 'modal')
        .attr('aria-label', 'Close');

        let sp1 = document.createElement('span');
        $(sp1)
        .attr('aria-hidden', 'true')
        .html('&times;')

        let d5 = document.createElement('div');
        $(d5)
        .attr('class', 'modal-body')
        .html(this.content);

        let d6 = document.createElement('div');
        $(d6)
        .attr('class', 'modal-footer');

        let b2 = document.createElement('button');
        $(b2)
        .attr('type', 'button')
        .attr('class', 'btn btn-secondary')
        .attr('data-dismiss', 'modal')
        .html(this.closeText);

        let b3 = document.createElement('button');
        $(b3)
        .attr('type', 'button')
        .attr('class', 'btn btn-primary')
        .html(this.okText);

        $(d1).append(d2);

        $(d2).append(d3);

        if(this.hasHeader){
            $(d3).append(d4);
        }
        
        $(d3).append(d5)

        if(this.hasFooter){            
            $(d3).append(d6)
        }
        
        $(d4).append(h1);

        if(this.hasClose){
            $(d4).append(b1);
        }

        $(b1).append(sp1);
        
        if(this.hasButtonClose){
            $(d6).append(b2);
        }
        
        if(this.hasButtonOk){
            $(d6).append(b3)
        }

        self = this;

        $(b1).on('click', function(){
            self.closeOnClick(self, this);
        });
        $(b2).on('click', function(){
            self.buttonCloseOnClick(self, this);

        });
        $(b3).on('click', function(){
            self.buttonOkOnClick(self, this);
            self.hide();
        });

        //$("#container").append(d1);
        
        

        $(d1).modal({
            keyboard: false
        });

        $(d1).on('hidden.bs.modal', function (e) {
            self.destroy();
        });

        this.element = $(d1);
        
    }
}


class DialogManager{
    constructor(){

    }
    static info(content){
        return new Dialog({
            dataBackDrop: true,
            content : `<div class="row justify-content-center">
                            <div class="spinner-border" role="status">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </div>
                        <div class="row justify-content-center">
                            <strong>${content}</strong>
                        </div>`
            
        });
    }

    static yesNo(content, onOkClick, onCloseClick){
        return new Dialog({
            title: 'Confirm',
            dataBackDrop: true,
            hasButtonClose: true,
            hasButtonOk: true,
            hasHeader: true,
            hasFooter: true,
            content : `<div class="row justify-content-center">
                            <strong>${content}</strong>
                        </div>`,
            buttonOkOnClick: onOkClick,
            buttonCloseOnClick: onCloseClick,
            okText: 'Yes',
            closeText: 'No'
            
        });
    }
}


/*
        this.title = props.title || '';
        this.content = props.content || '';
        this.hasClose = props.hasClose || false;
        this.hasButtonClose = props.hasButtonClose || false;
        this.hasButtonOk = props.hasButtonOk || false;
        this.hasHeader = props.hasHeader || false;
        this.hasFooter = props.hasFooter || false;
        this.dataBackDrop = props.dataBackDrop || false;
        this.buttonOkOnClick = props.buttonOkOnClick || function(){};
        this.buttonCloseOnClick = props.buttonCloseOnClick || function(){};
        this.closeOnClick = props.closeOnClick || function(){};
*/