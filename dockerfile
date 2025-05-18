FROM nginx:1.28-alpine

# RUN mkdir -p /etc/nginx/conf.d
RUN rm -rvf /etc/nginx/conf.d/default.conf
COPY ./default.conf /etc/nginx/conf.d/

# FROM nginx:alpine

ADD ./dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]