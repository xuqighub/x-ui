!function(win){
    const DISABLED = 'ui-disabled';
    var Pagination = function({
        mountEl,
        count=0, 
        theme,
        curPage=1,
        pageSize=10,
        groups=5,
        first,
        last,
        limits,
        prev,
        next,
        layout,
        callback
    }){
        //数据总数
        this.count = count|0;
        //挂载的el
        this.mountedEl = document.querySelector(mountEl);
        if(!this.mountedEl){
            throw new Error('could not found the mountedEl');
        }
        //pageSize,每页数据大小条数
        this.pageSize = pageSize || 20;
        //展示几个页码
        this.groups = groups || 5;
        
        //当前页
        this.curPage = (curPage|0) || 1;
        this.theme = theme;
        //首页
        this.first = first;
        //最后一页
        this.last = last;
        this.prev = prev;
        this.next = next;
        this.callback = callback;
        this.limits = typeof limits === 'object'
            ? limits
            : [10,20,30,40,50];
        
        //排版
        this.layout = typeof layout === 'object' 
            ? layout 
            : ['prev','page','next'];
        
        //首次渲染
        this.render();

        this.jumpEvent();
        
    }
    Pagination.prototype.view = function(){
        //以当前分页数共有多少页
        this.pagesTotal = Math.ceil(this.count/this.pageSize) || 1;
        //限制curpage
        if(this.curPage > this.pagesTotal){
            this.curPage = this.pagesTotal;
        }
        let {layout,limits,pagesTotal,count,groups,curPage,first,last,theme,prev,next,pageSize} = this;
        //矫正groups数值
        if(groups < 0){
            groups = 1;
        }else if(groups > this.pagesTotal){
            groups = this.pagesTotal;
        }
        
        //计算当前组
        let index = pagesTotal > groups 
            ? Math.ceil( (curPage + (groups > 1 ? 1 : 0)) / (groups > 0 ? groups : 1) ) 
            : 1;
            //console.log(index,'indexxxxx',pagesTotal,curPage)
        //视图片段
        let views = {
            
            //页码  
            page:function(){
                let pager = []; 
                //数据量为0时，不输出页码
                if(count<1){
                    return '';
                }
                //首页
                if(index > 1 && first !== false && groups !== 0){
                    pager.push('<a href="javascript:;" class="ui-pagenation-first" data-page="1" title="&#x9996;&#x9875;">'+(first || 1)+'</a>');
                }

                //计算当前页码组的起始页
                let halve = Math.floor((groups-1)/2)//页码数等分2
                    ,start = index > 1 ? curPage - halve : 1 //1
                    ,end = index > 1 ? (function(){
                        var max = curPage + (groups-halve-1);
                        return max > pagesTotal ? pagesTotal : max;
                    }()) : groups; //5
                //console.log(start,end,'start,end',groups);
                
                //防止最后一组出现 “不规定”的连续页码数，因为要算上本身所以要加一
                if(end - start + 1 < groups){
                    start = end - groups + 1;
                }

                //输出左分隔符
                if(first !== false && start > 2){
                    pager.push('<span class="ui-pagenation-spr">&#x2026;</span>')
                }

                //输出连续页码
                for(let pageIndex = start; pageIndex <= end; pageIndex++){
                    if(pageIndex === curPage){
                        //当前页
                        pager.push(`<span class="ui-pagenation-cur"
                        >
                        <em class="ui-pagination-em"
                            ${theme ? ("style=background-color:"+theme+";"):''}
                        ></em>
                        <em>${pageIndex}</em>
                        </span>`);
                    }else{
                        pager.push(`<a href="javascript:;" data-page="${pageIndex}">${pageIndex}</a>`);
                    }
                }

                //输出右分隔符 和 末页
                if(pagesTotal > groups && pagesTotal > end && last !== false){
                    if(end + 1 < pagesTotal){
                        pager.push('<span class="ui-pagenation-spr">&#x2026;</span>');
                    }
                    if(groups !== 0){
                        pager.push(`<a href="javascript:;" class="ui-pagenation-last" title="&#x5C3E;&#x9875;" data-page=${pagesTotal}>${last || pagesTotal}</a>`);
                    }
                }
                 
                return pager.join('');
            }()
        
            //上一页
            ,prev:function(){
                return prev
                ? `<a href="javascript:;" 
                class="ui-pagination-prev ${curPage === 1 ? 'ui-disabled' : ''}" 
                data-page="${curPage-1}">${prev}</a>` 
                : '';
            }()
            
            //下一页
            ,next:function(){
                return next 
                ? `<a href="javascript:;" 
                class="ui-pagination-next ${curPage === pagesTotal ? 'ui-disabled' : ''}"
                data-page="${curPage+1}">${next}</a>`
                : '';
            }()
            
            //数据总数
            ,count:`<span class="ui-pagenation-count">共${' '+ count +' '}条</span>`
            
            //每页条数
            ,limits:function(){
                let options = limits.map(item=>{
                    return `<option ${item === +pageSize ? 'selected' : ''} value=${item}>${item +' '}条/页</option>`;
                });
                return (
                    `<span class="ui-pagenation-limits">
                        <select>${options.join('')}</select>    
                    </span>`);
            }()

            //刷新当前页
            ,refresh:`<a href="javascript:;" class="ui-pagenation-refresh" style="${theme ? 'color:'+theme : ''}" data-page=${curPage}>
                <svg viewBox="64 64 896 896" focusable="false" class="" data-icon="reload" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"></path></svg>
            </a>`

            //跳转区域
            ,skip:function(){
                return (
                    `<span class="ui-pagenation-skip">&#x5230;&#x7B2C;<input 
                        type="text" min="1" value="${curPage}" />&#x9875;<button 
                        type="button">&#x786e;&#x5b9a;</button>
                    </span>`);
            }()
        }
       
        //let pagerBox = `<div class="ui-pagenation-pager">${views.page}</div>`;

        let struct = layout.map(item=>{
            return views[item];
        }).join('');
        return  struct;
    }

    Pagination.prototype.render = function(){
        let innerHTML =`<div class="ui-pagination">${this.view()}</div>`; 
        this.mountedEl.innerHTML = innerHTML;
    }

    //更新count数据，比如删除了数据，count变化，分页会变化/
    //第二个参数callback是操作点击pagination之后的callback回调函数
    Pagination.prototype.update = function({count,curPage,pageSize,groups},callback){
        this.count = count || this.count;
        this.curPage = curPage || this.curPage;
        // this.groups = groups || this.groups;
        //更新callback函数
        callback && (this.callback = callback);
        // console.log(this.callback,'callback');
        this.pageSize = pageSize || this.pageSize;
        this.render();
    }

    //关于pagination的事件
    Pagination.prototype.jumpEvent = function(){
        //点击第几页
        this.mountedEl.onclick = (ev)=>{
            //这里有一个刷新按钮里面有个i
            let target = ev.target;
            if(target.nodeName.toUpperCase()==='SVG'){
                target = target.parentNode;
            }
            //点击的是页数 a，里面有data-page,
            if(target.nodeName.toUpperCase() === 'A'){
                let curpage = target.dataset.page|0;
                if(curpage < 1 || curpage > this.pagesTotal) return ;
                this.curPage = curpage;
                this.render();
                //pagination上的事件操作后的回调函数，比如获取数据
                let {curPage,pageSize,pagesTotal} = this;
                this.callback?.({curPage,pageSize,pagesTotal});
            }
            //点击跳转到多少页的确定
            if(ev.target.nodeName.toUpperCase() === 'BUTTON'){
                let input = this.mountedEl.querySelector('input');
                let cur = input.value.replace(/\s|\D/g,'')|0;
                input.value = cur ? cur : this.curPage;
                if(cur && cur !== this.curPage){
                    this.curPage = cur;
                    this.render();

                    //pagination上的事件操作后的回调函数，比如获取数据
                    let {curPage,pageSize,pagesTotal} = this;
                    this.callback?.({curPage,pageSize,pagesTotal});
                }
            }
        }

        //跳转到多少页的input事件
        this.mountedEl.onkeyup = (ev)=>{
            let target = ev.target;
            if(target.nodeName.toUpperCase() === 'INPUT'){
                let cur = target.value.replace(/\s|\D/g,'')|0;
                target.value = cur ? cur : this.curPage;
                console.log(ev.keyCode)
                if(ev.keyCode === 13){
                    if(cur && cur !== this.curPage){
                        this.curPage = cur;
                        this.render();

                        //pagination上的事件操作后的回调函数，比如获取数据
                        let {curPage,pageSize,pagesTotal} = this;
                        this.callback?.({curPage,pageSize,pagesTotal});
                    }
                    
                }
            }
        }

        //下拉框选择分页条数
        this.mountedEl.onchange = (ev)=>{
            if(ev.target.nodeName.toUpperCase() === 'SELECT'){
                this.pageSize = +ev.target.value;
                this.render();

                //pagination上的事件操作后的回调函数，比如获取数据
                let {curPage,pageSize,pagesTotal} = this;
                this.callback?.({curPage,pageSize,pagesTotal});
            }
        }
        
    }

    //获取当前pagination的状态数据
    Pagination.prototype.getStatus = function(){
        return {
            curPage:this.curPage,
            pageSize:this.pageSize,
            count:this.count,
        }
    }

    var pagination = {};

    pagination.render = function(obj){
        return new Pagination(obj);
    }

    window.pagination = pagination;

}(window)