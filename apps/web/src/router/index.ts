import { createRouter, createWebHistory } from 'vue-router';
import SetupView from '../views/SetupView.vue';
import InterviewView from '../views/InterviewView.vue';
import ReportView from '../views/ReportView.vue';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'setup', component: SetupView },
        { path: '/interview/:id', name: 'interview', component: InterviewView },
        { path: '/interview/:id/report', name: 'report', component: ReportView },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});
