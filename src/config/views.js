import React from 'react';

//models
import {Route} from 'mobx-router';

//components
import Program from '../components/program';
import Aggregate from '../components/aggregate';
import Schedule from '../components/schedule';

const views = {
    program: new Route({
        path: '/',
        component: <Program/>
    }),
    aggregate: new Route({
        path: '/aggregate',
        component: <Aggregate/>
    }),
    schedule: new Route({
        path: '/schedule',
        component: <Schedule/>,
    })
};
export default views;
